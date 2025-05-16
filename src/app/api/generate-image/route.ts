import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'No prompt provided' },
        { status: 400 }
      );
    }

    // 현재는 더미 이미지 URL 반환
    // 실제 프로덕션에서는 Stable Diffusion, OpenAI DALL-E, Midjourney 등의 
    // 이미지 생성 API를 호출하는 코드로 대체
    
    // 랜덤 이미지 URL 생성 (데모 목적)
    const imageTypes = [
      'business', 'marketing', 'product', 'abstract', 'technology'
    ];
    const randomType = imageTypes[Math.floor(Math.random() * imageTypes.length)];
    const randomId = Math.floor(Math.random() * 1000);
    const imageUrl = `https://source.unsplash.com/random/800x800/?${randomType}&sig=${randomId}`;

    // 실제 프로덕션에서는 아래와 같이 API 호출 코드 작성
    /*
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        n: 1,
        size: '1024x1024',
      }),
    });
    
    const data = await response.json();
    const imageUrl = data.data[0].url;
    */

    return NextResponse.json({ imageUrl });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate image' },
      { status: 500 }
    );
  }
} 