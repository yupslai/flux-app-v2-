import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get('audio') as Blob;

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    // 실제 구현에서는 OpenAI의 Whisper API나 다른 STT 서비스를 연결

    // 현재는 더미 응답 구현
    // 실제 구현 시 아래 코드 대신 API 연동 코드 작성
    return NextResponse.json({ 
      text: "이 제품은 20-30대 직장인을 위한 건강 보조 식품입니다. 천연 성분으로 만들어 부작용 걱정 없이 활력과 면역력 향상에 도움을 줍니다. 특히 바쁜 일상 속 건강관리가 어려운 현대인을 위해 개발되었으며, 휴대와 섭취가 간편합니다." 
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to process audio' },
      { status: 500 }
    );
  }
} 