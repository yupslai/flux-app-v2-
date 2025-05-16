'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Mic, MicOff, Download, RefreshCw } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

// 마케팅 템플릿 타입 정의
type MarketingTemplate = 'instagram' | 'facebook' | 'banner';

// 생성된 마케팅 자료 인터페이스
interface MarketingAsset {
  id: string;
  template: MarketingTemplate;
  imageUrl: string;
  headline?: string;
  description?: string;
  metadata?: { width: number; height: number };
}

export default function MarketingVoice() {
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [assets, setAssets] = useState<MarketingAsset[]>([]);
  const [transcribedText, setTranscribedText] = useState('');
  const [selectedTemplate, setSelectedTemplate] =
    useState<MarketingTemplate>('instagram');

  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);

  // 녹음 시작
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current = [];

      mediaRecorder.current.ondataavailable = (event) => {
        audioChunks.current.push(event.data);
      };

      mediaRecorder.current.onstop = async () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/wav' });
        await handleAudioInput(audioBlob);
      };

      mediaRecorder.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  // 녹음 중지
  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      setIsRecording(false);
      mediaRecorder.current.stream.getTracks().forEach((track) => track.stop());
    }
  };

  // 음성 입력 처리
  const handleAudioInput = async (audioBlob: Blob) => {
    setIsLoading(true);
    try {
      // 음성을 텍스트로 변환
      const formData = new FormData();
      formData.append('audio', audioBlob);

      const response = await fetch('/api/speech-to-text', {
        method: 'POST',
        body: formData,
      });

      const { text } = await response.json();
      setTranscribedText(text);

      // 마케팅 자료 생성 호출
      await generateMarketingAssets(text);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 텍스트 입력으로 자료 생성
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setIsLoading(true);
    try {
      await generateMarketingAssets(description);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 고유 ID 생성 함수
  const generateId = (): string => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  };

  // 마케팅 자료 생성 API 호출
  const generateMarketingAssets = async (text: string) => {
    try {
      console.log('Starting marketing asset generation with text:', text);

      // 마케팅 프롬프트 변환 API 호출
      console.log('Calling marketing-prompt API...');
      const promptResponse = await fetch('/api/marketing-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: text, template: selectedTemplate }),
      });

      if (!promptResponse.ok) {
        const errorData = await promptResponse.json();
        console.error('Marketing prompt API error:', {
          status: promptResponse.status,
          statusText: promptResponse.statusText,
          error: errorData,
        });
        throw new Error(
          `마케팅 프롬프트 생성 실패: ${errorData.error || promptResponse.statusText}`,
        );
      }

      const promptData = await promptResponse.json();
      console.log('Received prompt data:', promptData);

      // 변환된 프롬프트로 이미지 생성
      console.log('Calling generate-image API...');
      const imageResponse = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptData.prompt }),
      });

      if (!imageResponse.ok) {
        const errorData = await imageResponse.json();
        console.error('Generate image API error:', {
          status: imageResponse.status,
          statusText: imageResponse.statusText,
          error: errorData,
        });
        throw new Error(
          `이미지 생성 실패: ${errorData.error || imageResponse.statusText}`,
        );
      }

      const imageData = await imageResponse.json();
      console.log('Received image data:', imageData);

      // 새 마케팅 자료 추가
      const newAsset: MarketingAsset = {
        id: generateId(),
        template: selectedTemplate,
        imageUrl: imageData.imageUrl,
        headline: promptData.headline || '',
        description: promptData.description || '',
        metadata: imageData.metadata,
      };

      console.log('Creating new marketing asset:', newAsset);
      setAssets((prev) => [newAsset, ...prev]);
    } catch (error) {
      console.error('Detailed error in generateMarketingAssets:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  };

  // 이미지 다운로드
  const downloadImage = async (
    url: string,
    filename = 'marketing-asset.jpg',
  ) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  // 템플릿 영어명 한글로 변환
  const getTemplateLabel = (template: MarketingTemplate) => {
    switch (template) {
      case 'instagram':
        return 'Instagram 포스트';
      case 'facebook':
        return 'Facebook 광고';
      case 'banner':
        return '웹 배너';
      default:
        return template;
    }
  };

  return (
    <div className="flex flex-col">
      {/* 템플릿 선택 탭 */}
      <Tabs
        defaultValue="instagram"
        className="mb-6"
        onValueChange={(value: string) =>
          setSelectedTemplate(value as MarketingTemplate)
        }
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="instagram">Instagram 포스트</TabsTrigger>
          <TabsTrigger value="facebook">Facebook 광고</TabsTrigger>
          <TabsTrigger value="banner">웹 배너</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* 입력 섹션 */}
      <Card className="p-4 mb-8">
        <div className="mb-4">
          <h3 className="text-lg font-medium mb-2">
            제품/서비스를 설명해주세요
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            음성으로 설명하거나 직접 입력하세요. 타겟 고객, 주요 특징, 브랜드
            톤을 포함하면 더 좋은 결과를 얻을 수 있습니다.
          </p>

          {transcribedText && (
            <div className="mb-4 p-3 bg-gray-100 rounded">
              <p className="font-medium mb-1">변환된 텍스트:</p>
              <p>{transcribedText}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="제품/서비스 설명..."
              disabled={isLoading || isRecording}
              className="flex-1"
            />
            <Button
              type="button"
              onClick={isRecording ? stopRecording : startRecording}
              variant="outline"
              disabled={isLoading}
              title={isRecording ? '녹음 중지' : '음성 녹음'}
            >
              {isRecording ? (
                <MicOff className="w-4 h-4" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </Button>
            <Button
              type="submit"
              disabled={isLoading || isRecording || !description.trim()}
            >
              {isLoading ? '생성 중...' : '생성'}
            </Button>
          </form>
        </div>
      </Card>

      {/* 로딩 표시 */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center my-8 space-y-4">
          <RefreshCw className="w-8 h-8 animate-spin text-primary" />
          <div className="text-center">
            <p className="font-medium">마케팅 자료 생성 중...</p>
            <p className="text-sm text-gray-500">잠시만 기다려주세요</p>
          </div>
        </div>
      )}

      {/* 결과 표시 */}
      {assets.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold mb-4">생성된 마케팅 자료</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {assets.map((asset) => (
              <Card key={asset.id} className="overflow-hidden">
                <div className="relative group">
                  <img
                    src={asset.imageUrl}
                    alt={`생성된 마케팅 자료 - ${getTemplateLabel(asset.template)}`}
                    className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity duration-300">
                    <div className="absolute bottom-0 left-0 right-0 p-3 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">
                          {getTemplateLabel(asset.template)}
                        </span>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => downloadImage(asset.imageUrl)}
                            className="hover:bg-white/20"
                            title="이미지 다운로드"
                          >
                            <Download className="w-4 h-4 text-white" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {asset.headline && (
                  <div className="p-4">
                    <h4 className="font-semibold text-lg mb-2">
                      {asset.headline}
                    </h4>
                    {asset.description && (
                      <p className="text-sm text-gray-600">
                        {asset.description}
                      </p>
                    )}
                    {asset.metadata && (
                      <div className="mt-2 text-xs text-gray-500">
                        <p>
                          이미지 크기: {asset.metadata.width}x
                          {asset.metadata.height}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
