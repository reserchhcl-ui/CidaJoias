import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden">
      {/* Sidebar Fixa */}
      <AdminSidebar />

      {/* Área de Conteúdo Principal */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header Mobile (Opcional, mas recomendado para responsividade futura) */}
        <header className="md:hidden h-14 border-b bg-white flex items-center px-4">
          <span className="font-bold">Menu Mobile (WIP)</span>
        </header>

        {/* Conteúdo com Scroll Próprio */}
        <ScrollArea className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
             {children}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}