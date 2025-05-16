import { fal } from '@fal-ai/client';
import { auth } from '@/app/(auth)/auth';
import { supabase } from '@/lib/supabase/client';

// fal.ai 클라이언트 초기화
fal.config({
  credentials: process.env.FAL_KEY,
});

interface GenerateImageOptions {
  prompt: string;
  style?: string;
  size?: '512x512' | '768x768' | '1024x1024';
}

export async function generateImage({
  prompt,
  style = 'realistic',
  size = '768x768',
}: GenerateImageOptions) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new Error('Unauthorized');
    }

    // 이미지 생성 요청
    const result = await fal.subscribe('110602490-fast-sdxl', {
      input: {
        prompt,
        style,
        size,
      },
    });

    if (!result || !result.images || result.images.length === 0) {
      throw new Error('Failed to generate image');
    }

    const imageUrl = result.images[0].url;

    // 이미지 URL을 Supabase에 저장
    const { data, error } = await supabase
      .from('generated_images')
      .insert({
        user_id: session.user.id,
        image_url: imageUrl,
        prompt,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving image to database:', error);
      throw error;
    }

    return {
      imageUrl,
      id: data.id,
    };
  } catch (error) {
    console.error('Error generating image:', error);
    throw error;
  }
}

export async function getGeneratedImages(userId: string) {
  try {
    const { data, error } = await supabase
      .from('generated_images')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching generated images:', error);
    throw error;
  }
}

export async function deleteGeneratedImage(imageId: string) {
  try {
    const { error } = await supabase
      .from('generated_images')
      .delete()
      .eq('id', imageId);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error deleting generated image:', error);
    throw error;
  }
}
