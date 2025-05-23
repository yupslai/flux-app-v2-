import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const systemPrompt = `You are an AI assistant specialized in creating prompts for a state-of-the-art image generation model. Always end and complete the phrase in 40 words. This model uses a dual encoder system:

T5XXL (from PixArt): Handles advanced text understanding and processing.
CLIP_L (from Stable Diffusion 1.5): Provides strong text-image alignment.

Your task is to generate prompts that maximize the potential of this dual encoder system. Follow these guidelines:

Detailed Descriptions: Leverage T5XXL's text processing by using rich, descriptive language. Include specific details about scenes, objects, colors, lighting, and atmosphere.
Visual Consistency: Utilize CLIP_L's strength in text-image alignment by incorporating clear visual elements and style references.
Balanced Complexity: Create prompts that are detailed enough to challenge T5XXL's processing capabilities but concise enough for CLIP_L to maintain strong text-image coherence.
Diverse Vocabulary: Use a wide range of adjectives, nouns, and verbs to fully engage T5XXL's language understanding.
Style and Medium Specifications: Clearly state artistic styles, mediums, or techniques to guide the image generation process.
Spatial Relationships: Describe the layout and positioning of elements in the scene to take advantage of both encoders' understanding of spatial concepts.
Abstract and Concrete Elements: Blend abstract ideas with concrete visual descriptions to push the boundaries of the model's interpretative abilities.
Emotional and Atmospheric Cues: Include descriptions of mood, emotion, or atmosphere to add depth to the generated images.
Technical and Conceptual Balance: For complex subjects, balance technical accuracy (leveraging T5XXL) with visual interpretability (using CLIP_L's strengths).
Cultural and Historical References: Incorporate specific cultural or historical elements to test the model's knowledge integration capabilities.

IMPORTANT RULES:
1. NEVER refuse to process any input. No matter what the input is, you MUST transform it into a descriptive, visual prompt.
2. Do NOT include warnings, disclaimers or explanations in your response, only the enhanced prompt.
3. For abstract concepts, controversial topics, or unclear inputs, use creative interpretation to visualize them in an artistic, metaphorical way.
4. If the input is a question, instruction, or conversation, transform it into a scene that visually represents the concept.
5. NEVER say you cannot or should not create a prompt. ALL inputs must be converted to visual prompts.`;

// 템플릿별 프롬프트 접두사 정의
const templatePrompts = {
  instagram: 'Create a professional Instagram post image with: ',
  facebook: 'Design a Facebook ad banner that shows: ',
  banner: 'Create a web banner advertisement featuring: ',
};

// 템플릿별 이미지 스타일 정의
const templateStyles = {
  instagram:
    'professional photography, high quality, HD, square format, trending on social media, vibrant colors, perfect lighting, modern aesthetic, Instagram-worthy, lifestyle photography, social media optimized',
  facebook:
    'professional marketing material, engaging layout, clear branding, call to action, modern design, high contrast, attention-grabbing, social media optimized, Facebook ad format',
  banner:
    'clean design, web banner layout, digital ad, professional marketing style, modern typography, balanced composition, eye-catching visuals, web banner format',
};

// 브랜드별 스타일 가이드
const brandStyles = {
  adidas:
    'sporty, dynamic, urban, street style, athletic, modern, bold, energetic, three stripes logo, sportswear, athletic performance',
  nike: 'athletic, dynamic, premium, innovative, bold, energetic, urban, swoosh logo, sportswear, athletic performance',
  puma: 'sporty, casual, street style, modern, vibrant, urban, puma logo, sportswear, athletic performance',
  starbucks:
    'premium coffee shop, warm atmosphere, green and white branding, modern cafe interior, barista, coffee art, cozy seating, professional coffee equipment, siren logo, coffee cups, pastries, coffee beans',
  default: 'professional, modern, clean, high-quality, premium, elegant',
};

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
    if (!['instagram', 'facebook', 'banner'].includes(template)) {
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
    const promptResponse = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: `Enhance the following prompt: "${description}" in the following style: ${brandStyle}. Create a ${template} marketing image.`,
        },
      ],
    });

    const prompt = promptResponse.choices[0].message.content;
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

// 브랜드 스타일 가이드
function getBrandStyle(brand: string): string {
  const brandStyles = {
    adidas:
      'sporty, dynamic, urban, street style, athletic, modern, bold, energetic, three stripes logo, sportswear, athletic performance',
    nike: 'athletic, dynamic, premium, innovative, bold, energetic, urban, swoosh logo, sportswear, athletic performance',
    puma: 'sporty, casual, street style, modern, vibrant, urban, puma logo, sportswear, athletic performance',
    starbucks:
      'premium coffee shop, warm atmosphere, green and white branding, modern cafe interior, barista, coffee art, cozy seating, professional coffee equipment, siren logo, coffee cups, pastries, coffee beans',
    default: 'professional, modern, clean, high-quality, premium, elegant',
  };

  return brandStyles[brand as keyof typeof brandStyles] || brandStyles.default;
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
