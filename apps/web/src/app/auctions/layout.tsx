import React from 'react';

interface AuctionsLayoutProps {
  children: React.ReactNode;
  modal: React.ReactNode;
}

export default function AuctionsLayout({ children, modal }: AuctionsLayoutProps) {
  return (
    <>
      {children}
      {modal}
    </>
  );
}