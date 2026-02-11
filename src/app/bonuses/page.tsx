import { Metadata } from 'next';
import { SmartNavigation } from '@/components/SmartNavigation';
import BonusCompare from '@/components/BonusCompare';

export const metadata: Metadata = {
  title: '特典比價 — 跨影城電影特典比較 | 特典速報 パルパル',
  description:
    '一次比較各大影城（威秀、國賓、秀泰、美麗華）同部電影的入場特典，找出最划算的影城特典！',
  keywords: [
    '電影特典比較',
    '影城特典比價',
    '威秀特典',
    '國賓特典',
    '秀泰特典',
    '電影贈品比較',
    'movie bonus compare',
  ],
  openGraph: {
    title: '特典比價 — 跨影城電影特典比較 | 特典速報 パルパル',
    description: '一次比較各大影城同部電影的入場特典，找出最划算的影城特典！',
    type: 'website',
    url: 'https://paruparu.vercel.app/bonuses',
  },
};

export default function BonusesPage() {
  return (
    <div className="min-h-screen w-full bg-background">
      <SmartNavigation />

      <main className="container mx-auto px-4 py-8 sm:py-12">
        <BonusCompare />
      </main>
    </div>
  );
}
