'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Mic, MicOff, Download, RefreshCw } from 'lucide-react';

// AuthProvider 래퍼 추가
const NoAuthWrapper = ({ children }: { children: React.ReactNode }) => {
  return <div className="marketing-voice-container">{children}</div>;
};

// 마케팅 템플릿 타입 정의
type MarketingTemplate = 'instagram' | 'facebook' | 'banner';

// 생성된 마케팅 자료 인터페이스
interface MarketingAsset {
  id: string;
  template: MarketingTemplate;
  imageUrl: string;
  headline?: string;
  description?: string;
}

export default function MarketingVoice() {
  const [description, setDescription] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [assets, setAssets] = useState<MarketingAsset[]>([]);
  const [transcribedText, setTranscribedText] = useState<string>('');
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

      mediaRecorder.current.ondataavailable = (event: BlobEvent) => {
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

  // 고유 ID 생성 함수
  const generateId = (): string => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
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

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const { text } = await response.json();
      setTranscribedText(text);

      // 마케팅 자료 생성 호출
      await generateMarketingAssets(text);
    } catch (error) {
      console.error('Error:', error);
      alert('음성 변환 중 오류가 발생했습니다. 다시 시도해주세요.');
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
      alert('마케팅 자료 생성 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 마케팅 자료 생성 API 호출
  const generateMarketingAssets = async (text: string) => {
    try {
      // 마케팅 프롬프트 변환 API 호출
      const promptResponse = await fetch('/api/marketing-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: text, template: selectedTemplate }),
      });

      if (!promptResponse.ok) {
        throw new Error(`API request failed with status ${promptResponse.status}`);
      }

      const { prompt, headline, description: desc } = await promptResponse.json();

      // 변환된 프롬프트로 이미지 생성
      const imageResponse = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      if (!imageResponse.ok) {
        throw new Error(`API request failed with status ${imageResponse.status}`);
      }

      const { imageUrl } = await imageResponse.json();

      // 새 마케팅 자료 추가
      const newAsset: MarketingAsset = {
        id: generateId(),
        template: selectedTemplate,
        imageUrl,
        headline: headline || '',
        description: desc || '',
      };

      setAssets((prev) => [newAsset, ...prev]);
    } catch (error) {
      console.error('Error generating marketing assets:', error);
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
  const getTemplateLabel = (template: MarketingTemplate): string => {
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
    <NoAuthWrapper>
      <div className="flex flex-col">
        {/* 템플릿 선택 탭 */}
        <div className="mb-6">
          <div className="grid w-full grid-cols-3 bg-muted p-1 rounded-md">
            {(['instagram', 'facebook', 'banner'] as MarketingTemplate[]).map((template) => (
              <button
                key={template}
                onClick={() => setSelectedTemplate(template)}
                className={`px-3 py-1.5 text-sm font-medium ${
                  selectedTemplate === template
                    ? 'bg-background shadow-sm rounded-sm'
                    : 'text-muted-foreground'
                }`}
              >
                {getTemplateLabel(template)}
              </button>
            ))}
          </div>
        </div>

        {/* 입력 섹션 */}
        <Card className="p-4 mb-8">
          <div className="mb-4">
            <h3 className="text-lg font-medium mb-2">
              제품/서비스를 설명해주세요
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              음성으로 설명하거나 직접 입력하세요. 타겟 고객, 주요 특징, 브랜드
              톤을 포함하면 더 좋은 결과를 얻을 수 있습니다.
            </p>

            {transcribedText && (
              <div className="mb-4 p-3 bg-muted rounded">
                <p className="font-medium mb-1">변환된 텍스트:</p>
                <p>{transcribedText}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                value={description}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDescription(e.target.value)}
                placeholder="제품/서비스 설명..."
                disabled={isLoading || isRecording}
                className="flex-1"
              />
              <Button
                type="button"
                onClick={isRecording ? stopRecording : startRecording}
                variant="outline"
                disabled={isLoading}
              >
                {isRecording ? (
                  <MicOff className="w-4 h-4" />
                ) : (
                  <Mic className="w-4 h-4" />
                )}
              </Button>
              <Button
                type="submit"
                disabled={isLoading || isRecording || (!description.trim() && !transcribedText)}
              >
                생성
              </Button>
            </form>
          </div>
        </Card>

        {/* 로딩 표시 */}
        {isLoading && (
          <div className="flex justify-center items-center my-8">
            <RefreshCw className="w-6 h-6 animate-spin mr-2" />
            <span>마케팅 자료 생성 중...</span>
          </div>
        )}

        {/* 결과 표시 */}
        {assets.length > 0 && (
          <div>
            <h3 className="text-xl font-semibold mb-4">생성된 마케팅 자료</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {assets.map((asset) => (
                <Card key={asset.id} className="overflow-hidden">
                  <div className="relative">
                    <img
                      src={asset.imageUrl}
                      alt={`생성된 마케팅 자료 - ${getTemplateLabel(asset.template)}`}
                      className="w-full h-64 object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">
                          {getTemplateLabel(asset.template)}
                        </span>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => downloadImage(asset.imageUrl)}
                          >
                            <Download className="w-4 h-4 text-white" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                  {asset.headline && (
                    <div className="p-3">
                      <h4 className="font-semibold">{asset.headline}</h4>
                      {asset.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {asset.description}
                        </p>
                      )}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </NoAuthWrapper>
  );
} 