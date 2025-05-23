import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { FalClient } from '@fal-ai/serverless-client';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Fal.ai client
const falClient = new FalClient({
  credentials: process.env.FAL_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { input, template } = await req.json();

    // Generate marketing copy using OpenAI
    const copyResponse = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are a marketing expert. Generate compelling marketing copy for a ${template} based on the following description. Keep it concise and engaging.`,
        },
        {
          role: 'user',
          content: input,
        },
      ],
    });

    const marketingCopy = copyResponse.choices[0].message.content;

    // Generate image using Fal.ai
    const imageResponse = await falClient.subscribe('fal-ai/stable-diffusion', {
      input: {
        prompt: `Create a professional marketing image for ${template} based on: ${input}`,
        image_size: '1024x1024',
        num_inference_steps: 50,
      },
    });

    let imageUrl = '';
    if (imageResponse.data?.images?.length > 0) {
      for (const image of imageResponse.data.images) {
        if (image.url) {
          if (/^[A-Za-z0-9+/=]{50,}$/.test(image.url)) {
            console.log('Found base64 in image.url');
            imageUrl = `data:image/jpeg;base64,${image.url}`;
          } else {
            imageUrl = image.url;
          }
          break;
        }
      }
    }

    return NextResponse.json({
      text: marketingCopy,
      image: imageUrl,
    });
  } catch (error) {
    console.error('Error generating marketing assets:', error);
    return NextResponse.json(
      { error: 'Failed to generate marketing assets' },
      { status: 500 },
    );
  }
}
