'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Mic, ImageIcon } from 'lucide-react';

export default function Navigation() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="bg-card shadow-sm mb-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <Link
              href="/"
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium ${
                isActive('/')
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              <Home className="h-4 w-4" />
              <span>홈</span>
            </Link>

            <Link
              href="/marketing"
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium ${
                isActive('/marketing')
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              <ImageIcon className="h-4 w-4" />
              <span>마케팅 이미지 생성</span>
            </Link>
          </div>

          <div className="flex items-center">
            <span className="text-sm font-semibold">MarketingVoice Demo</span>
          </div>
        </div>
      </div>
    </nav>
  );
}
