import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { fal } from '@fal-ai/client';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
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
    const imageResponse = await fal.run('fal-ai/fast-sdxl', {
      input: {
        prompt: `Create a professional marketing image for ${template} based on: ${input}`,
      },
    }) as any;

    let imageUrl = '';
    if (imageResponse.data?.images?.length > 0) {
      const image = imageResponse.data.images[0];
      if (image.url) {
        imageUrl = image.url;
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
