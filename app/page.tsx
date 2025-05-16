import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Mic, ImageIcon, Download } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        {/* 히어로 섹션 */}
        <section className="text-center py-12 md:py-20">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            MarketingVoice
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8">
            음성으로 설명하면 AI가 마케팅 자료를 생성해드립니다
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/marketing">
              <Button size="lg" className="gap-2">
                <Mic className="h-4 w-4" />
                시작하기
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          {/* 가상 이미지 (실제 서비스 사용 예시) */}
          <div className="relative mx-auto max-w-3xl rounded-lg overflow-hidden shadow-lg border">
            <img
              src="https://placehold.co/1200x630/f5f5f5/333333?text=MarketingVoice+Demo"
              alt="MarketingVoice 데모"
              className="w-full"
            />
          </div>
        </section>

        {/* 특징 섹션 */}
        <section className="py-12">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            주요 기능
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center p-4">
              <div className="p-3 bg-primary/10 rounded-full mb-4">
                <Mic className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">음성 설명</h3>
              <p className="text-muted-foreground">
                제품이나 서비스를 음성으로 설명하면 텍스트로 변환됩니다.
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-4">
              <div className="p-3 bg-primary/10 rounded-full mb-4">
                <ImageIcon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">맞춤형 이미지</h3>
              <p className="text-muted-foreground">
                다양한 마케팅 템플릿으로 최적화된 이미지를 생성합니다.
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-4">
              <div className="p-3 bg-primary/10 rounded-full mb-4">
                <Download className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">즉시 사용</h3>
              <p className="text-muted-foreground">
                생성된 이미지를 다운로드하여 바로 사용할 수 있습니다.
              </p>
            </div>
          </div>
        </section>

        {/* CTA 섹션 */}
        <section className="py-12 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            지금 바로 시작해보세요
          </h2>
          <p className="text-lg text-muted-foreground mb-6">
            복잡한 설정 없이 음성만으로 마케팅 자료를 만들어보세요
          </p>
          <Link href="/marketing">
            <Button size="lg">데모 사용해보기</Button>
          </Link>
        </section>
      </div>
    </div>
  );
}
