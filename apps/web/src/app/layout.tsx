import './globals.css';
import { Geist, Geist_Mono } from 'next/font/google';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { NotificationProvider } from '@/context/NotificationContext';
import Navbar from '@/app/components/Navbar'; 
import { Toaster } from 'sonner';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata = {
  title: 'Auction Marketplace',
  description: 'Bid, buy, and sell items on the premier real-time auction platform.',
};

export default function RootLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal?: React.ReactNode;
}) {
  return (
    <html lang="en" className={`h-full ${geistSans.variable} ${geistMono.variable}`}>
      <body 
        suppressHydrationWarning 
        className="bg-slate-50 text-slate-900 font-sans antialiased min-h-full flex flex-col"
      >
        <AuthProvider>
          <NotificationProvider>
            <CartProvider>
              <Navbar />
              <main className="flex-1">{children}</main>
              {modal}
              <Toaster 
                position="top-right" 
                richColors 
                closeButton 
                toastOptions={{
                  style: { borderRadius: '1rem' }
                }} 
              />
            </CartProvider>
          </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}