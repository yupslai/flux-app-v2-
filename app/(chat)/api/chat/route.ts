import {
  appendClientMessage,
  appendResponseMessages,
  createDataStream,
  smoothStream,
  streamText,
} from 'ai';
import { auth, type UserType } from '@/app/(auth)/auth';
import { type RequestHints, systemPrompt } from '@/lib/ai/prompts';
import {
  createStreamId,
  deleteChatById,
  getChatById,
  getMessageCountByUserId,
  getMessagesByChatId,
  getStreamIdsByChatId,
  saveChat,
  saveMessages,
} from '@/lib/db/queries';
import { generateUUID, getTrailingMessageId } from '@/lib/utils';
import { generateTitleFromUserMessage } from '../../actions';
import { createDocument } from '@/lib/ai/tools/create-document';
import { updateDocument } from '@/lib/ai/tools/update-document';
import { requestSuggestions } from '@/lib/ai/tools/request-suggestions';
import { getWeather } from '@/lib/ai/tools/get-weather';
import { isProductionEnvironment } from '@/lib/constants';
import { myProvider } from '@/lib/ai/providers';
import { entitlementsByUserType } from '@/lib/ai/entitlements';
import { postRequestBodySchema, type PostRequestBody } from './schema';
import { geolocation } from '@vercel/functions';
import {
  createResumableStreamContext,
  type ResumableStreamContext,
} from 'resumable-stream';
import { after } from 'next/server';
import type { Chat } from '@/lib/db/schema';
import { differenceInSeconds } from 'date-fns';

export const maxDuration = 60;

let globalStreamContext: ResumableStreamContext | null = null;

function getStreamContext() {
  if (!globalStreamContext) {
    try {
      globalStreamContext = createResumableStreamContext({
        waitUntil: after,
      });
    } catch (error: any) {
      if (error.message.includes('REDIS_URL')) {
        console.log(
          ' > Resumable streams are disabled due to missing REDIS_URL',
        );
      } else {
        console.error(error);
      }
    }
  }

  return globalStreamContext;
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const requestBody = postRequestBodySchema.parse(json);
    const { id, message, selectedChatModel, selectedVisibilityType } = requestBody;

    const session = await auth();
    if (!session?.user) {
      return new Response('Unauthorized', { status: 401 });
    }

    const userType: UserType = session.user.type;
    const messageCount = await getMessageCountByUserId({
      id: session.user.id,
      differenceInHours: 24,
    });

    if (messageCount > entitlementsByUserType[userType].maxMessagesPerDay) {
      return new Response(
        'You have exceeded your maximum number of messages for the day! Please try again later.',
        { status: 429 }
      );
    }

    const chat = await getChatById({ id });
    if (!chat) {
      const title = await generateTitleFromUserMessage({ message });
      await saveChat({
        id,
        userId: session.user.id,
        title,
        visibility: selectedVisibilityType,
      });
    } else if (chat.userId !== session.user.id) {
        return new Response('Forbidden', { status: 403 });
      }

    // Save user message first
    await saveMessages({
      messages: [
        {
          id: generateUUID(),
          chatId: id,
          role: 'user' as const,
          parts: [{ type: 'text', text: message.content }],
          attachments: [],
          createdAt: new Date(),
        },
      ],
    });

    const previousMessages = await getMessagesByChatId({ id });
    const messages = appendClientMessage({
      messages: previousMessages.map(msg => ({
        id: msg.id,
        role: msg.role as 'user' | 'assistant' | 'system' | 'data',
        content: Array.isArray(msg.parts) && msg.parts[0]?.text ? msg.parts[0].text : '',
        parts: Array.isArray(msg.parts) ? msg.parts : [{ type: 'text', text: '' }],
        attachments: Array.isArray(msg.attachments) ? msg.attachments : [],
      })),
      message,
    });

    const { longitude, latitude, city, country } = geolocation(request);
    const requestHints: RequestHints = { longitude, latitude, city, country };
    const streamId = generateUUID();

    await createStreamId({ streamId, chatId: id });

    const stream = createDataStream({
      execute: async (dataStream) => {
        try {
          const result = await streamText({
          model: myProvider.languageModel(selectedChatModel),
          system: systemPrompt({ selectedChatModel, requestHints }),
          messages,
          maxSteps: 5,
          experimental_activeTools:
            selectedChatModel === 'chat-model-reasoning'
              ? []
                : ['getWeather', 'createDocument', 'updateDocument', 'requestSuggestions'],
          experimental_transform: smoothStream({ chunking: 'word' }),
          experimental_generateMessageId: generateUUID,
          tools: {
            getWeather,
            createDocument: createDocument({ session, dataStream }),
            updateDocument: updateDocument({ session, dataStream }),
              requestSuggestions: requestSuggestions({ session, dataStream }),
          },
          onFinish: async ({ response }) => {
            if (session.user?.id) {
              try {
                const assistantId = getTrailingMessageId({
                  messages: response.messages.filter(
                      (message) => message.role === 'assistant'
                  ),
                });

                if (!assistantId) {
                  throw new Error('No assistant message found!');
                }

                const [, assistantMessage] = appendResponseMessages({
                  messages: [message],
                  responseMessages: response.messages,
                });

                await saveMessages({
                  messages: [
                    {
                      id: assistantId,
                      chatId: id,
                        role: 'assistant' as const,
                        parts: assistantMessage.parts || [{ type: 'text', text: '' }],
                        attachments: assistantMessage.experimental_attachments || [],
                      createdAt: new Date(),
                    },
                  ],
                });
                } catch (error) {
                  console.error('Failed to save chat:', error);
                  dataStream.writeData({
                    type: 'error',
                    error: 'Failed to save chat message',
                  });
              }
            }
          },
          experimental_telemetry: {
            isEnabled: isProductionEnvironment,
            functionId: 'stream-text',
          },
        });

          if (!result || !result.fullStream) {
            throw new Error('Failed to create stream');
          }

          for await (const delta of result.fullStream) {
            if (delta.type === 'text-delta') {
              dataStream.writeData({
                type: 'text-delta',
                content: delta.textDelta,
              });
            }
          }
        } catch (error) {
          console.error('Error in stream execution:', error);
          dataStream.writeData({
            type: 'error',
            error: 'An error occurred while processing your request',
        });
          throw error;
        }
      },
      onError: (error) => {
        console.error('Stream error:', error);
        return 'An error occurred while processing your request';
      },
    });

    const streamContext = getStreamContext();
    if (streamContext) {
      const resumableStream = await streamContext.resumableStream(streamId, () => stream);
      return new Response(resumableStream, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
        },
      });
    }

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('Error in POST handler:', error);
    return new Response('An error occurred while processing your request', { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
  const streamContext = getStreamContext();
  if (!streamContext) {
    return new Response(null, { status: 204 });
  }

  const { searchParams } = new URL(request.url);
  const chatId = searchParams.get('chatId');
  if (!chatId) {
    return new Response('id is required', { status: 400 });
  }

  const session = await auth();
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 });
  }

    const chat = await getChatById({ id: chatId });
  if (!chat) {
    return new Response('Not found', { status: 404 });
  }

  if (chat.visibility === 'private' && chat.userId !== session.user.id) {
    return new Response('Forbidden', { status: 403 });
  }

  const streamIds = await getStreamIdsByChatId({ chatId });
  if (!streamIds.length) {
    return new Response('No streams found', { status: 404 });
  }

  const recentStreamId = streamIds.at(-1);
  if (!recentStreamId) {
    return new Response('No recent stream found', { status: 404 });
  }

  const emptyDataStream = createDataStream({
    execute: () => {},
  });

    const stream = await streamContext.resumableStream(recentStreamId, () => emptyDataStream);
  if (!stream) {
      return new Response(emptyDataStream, { status: 200 });
    }

    return new Response(stream, { status: 200 });
  } catch (error) {
    console.error('Error in GET handler:', error);
    return new Response('An error occurred while processing your request', { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) {
    return new Response('Not Found', { status: 404 });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

    const chat = await getChatById({ id });
    if (chat.userId !== session.user.id) {
      return new Response('Forbidden', { status: 403 });
    }

    const deletedChat = await deleteChatById({ id });
    return Response.json(deletedChat, { status: 200 });
  } catch (error) {
    console.error('Error in DELETE handler:', error);
    return new Response('An error occurred while processing your request', { status: 500 });
  }
}
