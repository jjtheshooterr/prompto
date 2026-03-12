import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Guide | Promptvexity',
  description: 'Learn how the scoring system, ranking tiers, and community work on Promptvexity.',
};

export default function GuideLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
