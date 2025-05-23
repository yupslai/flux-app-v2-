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
    'professional photography, high quality, HD, square format, trending on social media, vibrant colors, perfect lighting, modern aesthetic, Instagram-worthy, lifestyle photography',
  facebook:
    'professional marketing material, engaging layout, clear branding, call to action, modern design, high contrast, attention-grabbing, social media optimized',
  banner:
    'clean design, web banner layout, digital ad, professional marketing style, modern typography, balanced composition, eye-catching visuals',
};

// 브랜드별 스타일 가이드
function getBrandStyle(brand: string): string {
  const brandStyles = {
    adidas:
      'sporty, dynamic, urban, street style, athletic, modern, bold, energetic, Adidas three stripes logo, sportswear, athletic performance, no text overlays, clean design, product focus',
    nike: 'athletic, dynamic, premium, innovative, bold, energetic, urban, Nike swoosh logo, sportswear, athletic performance, no text overlays, clean design, product focus',
    puma: 'sporty, casual, street style, modern, vibrant, urban, Puma logo, sportswear, athletic performance, no text overlays, clean design, product focus',
    starbucks:
      'premium coffee shop, warm atmosphere, green and white branding, modern cafe interior, barista, coffee art, cozy seating, professional coffee equipment, Starbucks siren logo, coffee cups, pastries, coffee beans, no text overlays, clean design, product focus',
    aquapick:
      'A square Instagram-style ad featuring the Aquapick water flosser as the main subject. The background is a vibrant gradient of clean blue tones with subtle water droplet textures. The sleek white water flosser device is positioned elegantly in the center, spraying a fine mist of water. Include the Aquapick logo prominently placed in the composition. The design is modern, minimal, and clean without any text overlays. Focus on dental care, oral hygiene, water flosser product, clean blue gradient background, water droplets, healthcare product, fresh, hygienic, professional product photography, minimalist design, no text, text-free',
    default: 'professional, modern, clean, high-quality, premium, elegant, no text overlays, clean design, product focus',
  };

  return brandStyles[brand as keyof typeof brandStyles] || brandStyles.default;
}

export async function POST(req: Request) {
  try {
    console.log('Received marketing prompt request');
    const body = await req.json();
    console.log('Request body:', body);

    const { description, template = 'instagram' } = body;

    if (!description) {
      console.error('No description provided in request');
      return NextResponse.json({ error: '설명이 필요합니다' }, { status: 400 });
    }

    // 템플릿 유효성 검사
    if (!Object.keys(templatePrompts).includes(template)) {
      console.error('Invalid template:', template);
      return NextResponse.json(
        { error: '유효하지 않은 템플릿입니다' },
        { status: 400 },
      );
    }

    // 브랜드 스타일 결정
    const brand = description.toLowerCase().split(' ')[0];
    const brandStyle = getBrandStyle(brand);

    // 마케팅 최적화 프롬프트 생성
    const basePrompt = `${templatePrompts[template as keyof typeof templatePrompts]}${description}`;
    const style = `${templateStyles[template as keyof typeof templateStyles]}, ${brandStyle}`;

    // 최종 프롬프트 구성
    const prompt = `${basePrompt}. ${style}`;
    console.log('Generated prompt:', prompt);

    // 마케팅 문구 생성
    const headline = generateHeadline(description, template, brand);
    console.log('Generated headline:', headline);

    const response = {
      prompt,
      headline,
      description:
        description.length > 60
          ? `${description.substring(0, 60)}...`
          : description,
    };
    console.log('Sending response:', response);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Detailed error in marketing-prompt:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      {
        error: '마케팅 요청 처리에 실패했습니다',
        details:
          error instanceof Error
            ? error.message
            : '알 수 없는 오류가 발생했습니다',
      },
      { status: 500 },
    );
  }
}

// 마케팅 헤드라인 생성 함수
function generateHeadline(
  description: string,
  template: string,
  brand: string,
): string {
  const keywords = {
    instagram: [
      '지금 바로',
      '새로운',
      '특별한',
      '한정판',
      '독점',
      '트렌디한',
      '스타일리시한',
    ],
    facebook: [
      '혁신적인',
      '최고의',
      '당신을 위한',
      '특별한',
      '프리미엄',
      '독점적인',
    ],
    banner: ['지금 바로', '특별한 기회', '한정 시간', '독점 혜택', '프리미엄'],
  };

  const templateKeywords =
    keywords[template as keyof typeof keywords] || keywords.instagram;
  const keyword =
    templateKeywords[Math.floor(Math.random() * templateKeywords.length)];

  // 브랜드별 맞춤 문구
  const brandPhrases = {
    adidas: '스포츠의 혁신',
    nike: 'Just Do It',
    puma: 'Forever Faster',
    starbucks: '스타벅스 커피',
    aquapick: '상쾌한 구강 관리',
    default: '새로운 경험',
  };

  const brandPhrase =
    brandPhrases[brand as keyof typeof brandPhrases] || brandPhrases.default;

  // 템플릿별 헤드라인 포맷
  switch (template) {
    case 'instagram':
      return `${keyword} ${brandPhrase} - ${description.split(' ').slice(0, 3).join(' ')}`;
    case 'facebook':
      return `${description.split(' ').slice(0, 3).join(' ')} - ${keyword} ${brandPhrase}`;
    case 'banner':
      return `${keyword} ${brandPhrase} 만나보세요!`;
    default:
      return `${keyword} ${brandPhrase}`;
  }
}
