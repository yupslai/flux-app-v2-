'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type TemplateType = 'instagram' | 'facebook' | 'web-banner';

export function MarketingGenerator() {
  const [input, setInput] = useState('');
  const [template, setTemplate] = useState<TemplateType>('instagram');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedAssets, setGeneratedAssets] = useState<{
    image: string;
    text: string;
  } | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      // TODO: Implement API calls to fal.ai and OpenAI
      // This is a placeholder for the actual implementation
      const response = await fetch('/api/marketing/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input,
          template,
        }),
      });

      const data = await response.json();
      setGeneratedAssets(data);
    } catch (error) {
      console.error('Error generating marketing assets:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="template">Template</Label>
            <Select
              value={template}
              onValueChange={(value) => setTemplate(value as TemplateType)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select template" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="instagram">Instagram Post</SelectItem>
                <SelectItem value="facebook">Facebook Ad</SelectItem>
                <SelectItem value="web-banner">Web Banner</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="input">Description</Label>
            <Textarea
              id="input"
              placeholder="Describe your product or service..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          <Button
            onClick={handleGenerate}
            disabled={!input || isGenerating}
            className="w-full"
          >
            {isGenerating ? 'Generating...' : 'Generate Marketing Assets'}
          </Button>
        </div>
      </Card>

      {generatedAssets && (
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-4">Generated Assets</h2>
          <div className="space-y-4">
            <div>
              <Label>Generated Image</Label>
              <img
                src={generatedAssets.image}
                alt="Generated marketing image"
                className="w-full rounded-lg mt-2"
              />
            </div>
            <div>
              <Label>Marketing Copy</Label>
              <p className="mt-2 text-muted-foreground">
                {generatedAssets.text}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
