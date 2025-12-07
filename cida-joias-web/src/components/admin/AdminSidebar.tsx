'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Package, 
  Tags, 
  ShoppingBag, 
  Briefcase, 
  Users, 
  LogOut, 
  Store 
} from 'lucide-react';
import { Button } from '../ui/button';
import { useAuthStore } from '@/store/use-auth-store';

const sidebarItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/admin/dashboard' },
  { icon: Package, label: 'Produtos', href: '/admin/products' },
  { icon: Tags, label: 'Categorias', href: '/admin/categories' },
  { icon: ShoppingBag, label: 'Pedidos', href: '/admin/orders' },
  { icon: Briefcase, label: 'Consignações', href: '/admin/sales-cases' },
  { icon: Users, label: 'Usuários', href: '/admin/users' },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { logout } = useAuthStore();

  return (
    <aside className="hidden md:flex flex-col w-64 border-r bg-slate-900 text-white min-h-screen">
      <div className="p-6 border-b border-slate-700">
        <h2 className="text-2xl font-bold tracking-tight">CidaJoias <span className="text-xs font-normal text-slate-400">Admin</span></h2>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {sidebarItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3 mb-1",
                  isActive 
                    ? "bg-slate-800 text-white hover:bg-slate-700" 
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Button>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}