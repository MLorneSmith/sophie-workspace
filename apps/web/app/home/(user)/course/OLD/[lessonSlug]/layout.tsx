import { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
  params: { lessonSlug: Promise<string> };
}

export default function Layout({ children }: LayoutProps) {
  return <>{children}</>;
}
