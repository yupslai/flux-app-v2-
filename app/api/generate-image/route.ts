import { NextResponse } from 'next/server';
import { fal } from '@fal-ai/client';

// fal.ai 클라이언트 초기화
fal.config({
  credentials: process.env.FAL_API_KEY as string,
});

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: '프롬프트가 필요합니다' },
        { status: 400 },
      );
    }

    console.log('Generating image with prompt:', prompt);
    console.log('Using model ID:', 'fal-ai/fast-sdxl');

    // fal.ai API를 사용하여 이미지 생성
    const result = await fal.run('fal-ai/fast-sdxl', {
      input: {
        prompt,
        image_size: 'square_hd',
        num_inference_steps: 50,
        guidance_scale: 8.5,
        negative_prompt:
          'blurry, low quality, distorted, deformed, ugly, bad anatomy, watermark, signature',
      },
    });

    console.log('Raw API response:', JSON.stringify(result, null, 2));

    // @ts-ignore - fal.ai SDK의 타입 정의가 잘못되어 있음
    if (!result?.data?.images?.[0]?.url) {
      console.error('Invalid API response structure:', result);
      throw new Error(
        '이미지 생성에 실패했습니다: API 응답 구조가 올바르지 않습니다',
      );
    }

    // @ts-ignore - fal.ai SDK의 타입 정의가 잘못되어 있음
    const imageUrl = result.data.images[0].url;
    console.log('Generated image URL:', imageUrl);

    return NextResponse.json({
      imageUrl,
      metadata: {
        width: result.data.images[0].width,
        height: result.data.images[0].height,
        contentType: result.data.images[0].content_type,
      },
    });
  } catch (error) {
    console.error('Error generating image:', error);
    return NextResponse.json(
      {
        error: '이미지 생성에 실패했습니다',
        details:
          error instanceof Error
            ? error.message
            : '알 수 없는 오류가 발생했습니다',
      },
      { status: 500 },
    );
  }
}
