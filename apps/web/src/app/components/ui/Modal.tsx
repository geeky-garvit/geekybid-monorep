// components/ui/Modal.tsx
'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function Modal({ children }: { children: React.ReactNode }) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const onDismiss = useCallback(() => {
    router.back();
  }, [router]);

  const onClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === overlayRef.current) {
        onDismiss();
      }
    },
    [onDismiss]
  );

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDismiss();
    },
    [onDismiss]
  );

  // Lock scroll and register ESC key listener
  useEffect(() => {
    document.addEventListener('keydown', onKeyDown);
    const originalStyle = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = originalStyle;
    };
  }, [onKeyDown]);

  return (
    <div
      ref={overlayRef}
      onClick={onClick}
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="relative bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 my-auto">
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Close modal"
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 font-bold text-sm w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 transition focus:outline-none focus:ring-2 focus:ring-purple-600"
        >
          ✕
        </button>
        {children}
      </div>
    </div>
  );
}