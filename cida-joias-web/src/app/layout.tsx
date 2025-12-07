import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import ReactQueryProvider from '@/providers/react-query-provider';
import { Toaster } from "@/components/ui/sonner"; 
import { Header } from '@/components/common/Header'; // 1. Importar Header

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'CidaJoias - Semi-joias Exclusivas',
  description: 'E-commerce e gestão de semi-joias.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <ReactQueryProvider>
          {/* 2. Adicionar o Header no topo da aplicação */}
          <Header />
          
          {children}
          <Toaster richColors position="top-center" duration={2000} /> 
        </ReactQueryProvider>
      </body>
    </html>
  );
}