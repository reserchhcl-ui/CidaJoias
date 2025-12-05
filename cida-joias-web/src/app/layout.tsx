import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import ReactQueryProvider from '@/providers/react-query-provider';
// 1. Importar o Toaster do Sonner
import { Toaster } from "../components/ui/sonner"; 

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
          {children}
          {/* 2. Adicionar o componente aqui */}
          <Toaster richColors position="top-right" /> 
        </ReactQueryProvider>
      </body>
    </html>
  );
}