import { NextResponse } from 'next/server';

// 템플릿별 프롬프트 접두사 정의
const templatePrompts = {
  instagram: 'Create a professional Instagram post image with: ',
  facebook: 'Design a Facebook ad banner that shows: ',
  banner: 'Create a web banner advertisement featuring: ',
};

// 템플릿별 이미지 스타일 정의
const templateStyles = {
  instagram:
    'professional photography, high quality, HD, square format, trending on social media',
  facebook:
    'professional marketing material, engaging layout, clear branding, call to action',
  banner:
    'clean design, web banner layout, digital ad, professional marketing style',
};

export async function POST(req: Request) {
  try {
    const { description, template = 'instagram' } = await req.json();

    if (!description) {
      return NextResponse.json(
        { error: 'No description provided' },
        { status: 400 },
      );
    }

    // 템플릿 유효성 검사
    if (!Object.keys(templatePrompts).includes(template)) {
      return NextResponse.json({ error: 'Invalid template' }, { status: 400 });
    }

    // 마케팅 최적화 프롬프트 생성
    const basePrompt = `${templatePrompts[template as keyof typeof templatePrompts]}${description}`;
    const style = templateStyles[template as keyof typeof templateStyles];

    // 최종 프롬프트 구성
    const prompt = `${basePrompt}. ${style}`;

    // 간단한 마케팅 문구 생성
    const headline = generateHeadline(description, template);

    return NextResponse.json({
      prompt,
      headline,
      description:
        description.length > 60
          ? `${description.substring(0, 60)}...`
          : description,
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to process marketing request' },
      { status: 500 },
    );
  }
}

// 마케팅 헤드라인 생성 함수
function generateHeadline(description: string, template: string): string {
  // 간단한 헤드라인 생성 구현
  const keywords = [
    '놀라운',
    '혁신적인',
    '최고의',
    '새로운',
    '특별한',
    '당신을 위한',
    '지금 바로',
    '놓치지 마세요',
    '독점적인',
  ];

  // 설명에서 첫 10단어 추출
  const words = description.split(' ').slice(0, 10);

  // 무작위 키워드 선택
  const keyword = keywords[Math.floor(Math.random() * keywords.length)];

  // 템플릿별 헤드라인 포맷
  switch (template) {
    case 'instagram':
      return `${keyword} ${words.slice(0, 5).join(' ')}`;
    case 'facebook':
      return `${words.slice(0, 3).join(' ')} - ${keyword} 경험을 제공합니다`;
    case 'banner':
      return `지금 바로 ${words.slice(0, 3).join(' ')} 만나보세요!`;
    default:
      return `${keyword} ${words.slice(0, 5).join(' ')}`;
  }
} 