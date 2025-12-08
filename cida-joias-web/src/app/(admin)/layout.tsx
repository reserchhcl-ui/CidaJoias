'use client'; 

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminMobileSidebar } from '@/components/admin/AdminMobileSidebar'; // Novo
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

  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.replace('/');
    }
  }, [user, router]);

  if (!user || user.role !== 'admin') {
      return (
        <div className="flex h-screen w-full items-center justify-center bg-slate-50">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      );
  }

  return (
    <div className="flex h-[calc(100vh-64px)] w-full bg-slate-50 overflow-hidden">
      
      {/* Sidebar Desktop (Escondida no mobile via CSS interno) */}
      <AdminSidebar />

      {/* Área Principal */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* Header Mobile do Admin (Só aparece no mobile) */}
        <div className="md:hidden flex items-center p-4 border-b bg-white">
            <AdminMobileSidebar />
            <span className="font-semibold text-lg ml-2">Menu Admin</span>
        </div>

        <ScrollArea className="flex-1 p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
             {children}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}