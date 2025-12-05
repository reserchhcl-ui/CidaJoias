'use client'; // Converta para Client Component para usar Hooks

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuthStore } from '@/store/use-auth-store';
import { Loader2 } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuthStore();
  const router = useRouter();

  // Verificação de Segurança Global do Layout
  useEffect(() => {
    // Se o user carregou e NÃO é admin -> Home
    if (user && user.role !== 'admin') {
      router.replace('/');
    }
  }, [user, router]);

  // Opcional: Renderizar loading enquanto não sabemos quem é o usuário
  // (Isso evita piscar a sidebar para quem não deve ver)
  if (!user || user.role !== 'admin') {
      return (
        <div className="flex h-screen w-full items-center justify-center bg-slate-50">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      );
  }

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden">
      <AdminSidebar />
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <ScrollArea className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
             {children}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}