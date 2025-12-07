'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, MapPin, ShoppingBag, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/use-auth-store';
import { authService } from '@/services/auth-service';

const items = [
  { label: 'Meus Dados', href: '/account/profile', icon: User },
  { label: 'Meus Pedidos', href: '/orders/meus-pedidos', icon: ShoppingBag }, // Ajustar rota se necessário
  { label: 'Endereços', href: '/account/addresses', icon: MapPin },
];

export function AccountSidebar() {
  const pathname = usePathname();
  const { logout } = useAuthStore();

  const handleLogout = () => {
    authService.logout();
    logout();
    window.location.href = '/login';
  };

  return (
    <nav className="flex flex-col space-y-2">
      {items.map((item) => (
        <Link key={item.href} href={item.href}>
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start gap-2",
              pathname === item.href ? "bg-slate-100 font-semibold" : "text-slate-600"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Button>
        </Link>
      ))}
      <Button 
        variant="ghost" 
        className="w-full justify-start gap-2 text-red-500 hover:text-red-600 hover:bg-red-50"
        onClick={handleLogout}
      >
        <LogOut className="h-4 w-4" />
        Sair
      </Button>
    </nav>
  );
}