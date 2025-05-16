import MarketingVoice from '../../components/MarketingVoice';

export const metadata = {
  title: 'MarketingVoice - 음성으로 마케팅 자료 생성',
  description: '음성 설명으로 마케팅 자료를 생성하는 AI 도구',
};

export default function MarketingPage() {
  return (
    <main className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-4">MarketingVoice</h1>
        <h2 className="text-xl text-center mb-8 text-muted-foreground">
          음성 설명으로 마케팅 자료 생성
        </h2>
        <MarketingVoice />
      </div>
    </main>
  );
} 