import { NextResponse } from 'next/server';
import { fal } from '@fal-ai/client';

// fal.ai 클라이언트 초기화
fal.config({
  credentials: process.env.FAL_API_KEY as string,
});

// API 응답 타입 정의
interface FluxLoraResponse {
  images?: Array<{ url: string; content_type?: string }> | string[];
  image?: string | { url: string; content_type?: string };
  result?: string | { url: string; content_type?: string };
  output?: string | { url: string; content_type?: string };
  data?: string | { url: string; content_type?: string };
  detail?: string;
  error?: string;
  status?: string;
  message?: string;
  [key: string]: any; // 인덱스 시그니처 추가
}

// base64 문자열 체크 함수 추가
function isBase64(str: string) {
  return /^[A-Za-z0-9+/=]+$/.test(str) && str.length > 100;
}

function convertToDataUrl(base64Str: string) {
  return `data:image/jpeg;base64,${base64Str}`;
}

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: '프롬프트가 필요합니다' },
        { status: 400 },
      );
    }

    console.log('=== API Request Details ===');
    console.log('Prompt:', prompt);

    // 프롬프트를 최소한으로 수정
    const enhancedPrompt = `${prompt} - Create this exact scene with high quality, detailed rendering, professional photography style.`;

    console.log('Enhanced Prompt:', enhancedPrompt);

    try {
      // API 요청 파라미터 로깅
      const requestParams = {
        prompt: enhancedPrompt,
        width: 1024,
        height: 1024,
        guidance_scale: 10.0,
      };
      console.log(
        'API Request Parameters:',
        JSON.stringify(requestParams, null, 2),
      );

      // fal.ai API를 사용하여 이미지 생성
      const result = (await fal.run('fal-ai/fast-sdxl', {
        input: {
          prompt: enhancedPrompt,
        },
      })) as any; // any 타입으로 변환

      console.log('=== API Response Details ===');
      console.log('🚨 FAL 응답 전체:', JSON.stringify(result, null, 2));

      // 응답 구조 검증
      if (!result || typeof result !== 'object') {
        console.error('❌ result is not an object:', result);
        throw new Error('Invalid API response: Not an object');
      }

      // 에러 응답 확인
      if (result.error || result.detail || result.status === 'error') {
        console.error('API Error Response:', {
          error: result.error,
          detail: result.detail,
          status: result.status,
          message: result.message,
        });
        throw new Error(
          result.error ||
            result.detail ||
            result.message ||
            'API error occurred',
        );
      }

      // URL 추출
      let imageUrl: string | undefined;

      // fast-sdxl 모델은 URL 직접 제공 (data.images[0].url)
      if (result.data?.images?.length > 0) {
        const image = result.data.images[0];
        if (image.url) {
          imageUrl = image.url;
          console.log('Found image URL:', imageUrl);
        }
      }

      if (!imageUrl) {
        console.error('No valid image URL found in the response');
        return NextResponse.json(
          { error: 'No valid image URL found in the response' },
          { status: 500 },
        );
      }

      console.log('Generated Image URL:', imageUrl);
      console.log('===========================');

      // 디버깅을 위해 전체 응답 반환
      return NextResponse.json({
        debugRawResponse: result, // 개발 중에만 사용
        imageUrl: imageUrl, // 이미지 URL 직접 반환
        metadata: {
          contentType: 'image/jpeg',
          source: 'fal-ai/fast-sdxl',
        },
      });
    } catch (apiError: any) {
      // 422 ValidationError 처리
      if (apiError.status === 422) {
        const errorDetails = apiError.body?.detail;
        console.error('=== Validation Error Details ===');
        console.error('Status:', apiError.status);
        console.error('Message:', apiError.message);
        console.error('Details:', JSON.stringify(errorDetails, null, 2));
        console.error('=============================');

        return NextResponse.json(
          {
            error: '이미지 생성에 실패했습니다',
            details: errorDetails || apiError.message,
            validationErrors: errorDetails,
          },
          { status: 422 },
        );
      }
      throw apiError;
    }
  } catch (error) {
    // 더 자세한 에러 로깅
    console.error('=== Detailed Error Information ===');
    console.error(
      'Error Type:',
      error instanceof Error ? error.name : 'Unknown',
    );
    console.error(
      'Error Message:',
      error instanceof Error ? error.message : 'Unknown error',
    );
    console.error(
      'Error Stack:',
      error instanceof Error ? error.stack : 'No stack trace',
    );
    if (error instanceof Error && 'response' in error) {
      console.error('Error Response:', JSON.stringify(error.response, null, 2));
    }
    if (error instanceof Error && 'body' in error) {
      console.error('Error Body:', JSON.stringify(error.body, null, 2));
    }
    console.error('================================');

    // 에러 응답
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
