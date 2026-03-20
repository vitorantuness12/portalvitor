import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { PwaHeader } from './PwaHeader';
import { PwaBottomNav } from './PwaBottomNav';
import { useIsPwa } from '@/hooks/useIsPwa';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

interface PwaLayoutProps {
  children: ReactNode;
  /** Hide bottom nav (e.g. on study page which has its own nav) */
  hideBottomNav?: boolean;
  /** Hide header entirely */
  hideHeader?: boolean;
}

export function PwaLayout({ children, hideBottomNav = false, hideHeader = false }: PwaLayoutProps) {
  const isPwa = useIsPwa();

  if (!isPwa) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {!hideHeader && <PwaHeader />}
      <motion.main
        className={`flex-1 ${!hideBottomNav ? 'pb-16' : ''}`}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      >
        {children}
      </motion.main>
      {!hideBottomNav && <PwaBottomNav />}
    </div>
  );
}
