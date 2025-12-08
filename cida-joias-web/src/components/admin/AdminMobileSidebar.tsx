'use client';

import { useState } from 'react';
import { Menu } from 'lucide-react';
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger, 
  SheetHeader, 
  SheetTitle 
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { AdminSidebar } from './AdminSidebar';

export function AdminMobileSidebar() {
  // Estado para controlar a abertura/fechamento
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden mr-2">
          <Menu className="h-6 w-6" />
          <span className="sr-only">Abrir menu</span>
        </Button>
      </SheetTrigger>
      
      <SheetContent side="left" className="p-0 w-72 bg-slate-900 border-slate-800 text-white">
        <SheetHeader className="sr-only">
            <SheetTitle>Menu de Navegação</SheetTitle>
        </SheetHeader>

        <div className="h-full py-4">
            {/* Passamos a função para fechar o menu */}
            <AdminSidebar isMobile={true} onNavigate={() => setOpen(false)} /> 
        </div>
      </SheetContent>
    </Sheet>
  );
}