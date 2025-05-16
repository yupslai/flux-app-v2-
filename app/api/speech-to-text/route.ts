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

    // 실제 API 호출 대신 샘플 텍스트 반환
    const sampleTexts = [
      "이 제품은 20-30대 직장인을 위한 건강 보조 식품입니다. 천연 성분으로 만들어 부작용 걱정 없이 활력과 면역력 향상에 도움을 줍니다. 특히 바쁜 일상 속 건강관리가 어려운 현대인을 위해 개발되었으며, 휴대와 섭취가 간편합니다.",
      "저희 서비스는 디지털 마케팅 자동화 플랫폼으로, 소상공인들이 쉽게 온라인 마케팅을 할 수 있도록 도와줍니다. AI 기반 콘텐츠 생성과 타깃 광고 최적화를 통해 마케팅 비용은 줄이고 효과는 높입니다.",
      "새롭게 출시된 이 앱은 일상 생활의 모든 예산을 관리해주는 개인 재무 도우미입니다. 지출 패턴을 분석하고 맞춤형 절약 팁을 제공하며, 금융 목표 달성을 위한 계획을 자동으로 생성합니다.",
    ];

    const randomIndex = Math.floor(Math.random() * sampleTexts.length);
    return NextResponse.json({ text: sampleTexts[randomIndex] });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to process audio' },
      { status: 500 }
    );
  }
} 