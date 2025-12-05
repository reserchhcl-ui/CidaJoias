'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingCart, LogOut, User } from 'lucide-react'; // Removida a importação errada de Link se houver
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/use-auth-store';

export function Header() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="border-b bg-white sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="text-2xl font-bold text-primary">
          CidaJoias
        </Link>

        {/* Ações */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon">
            <ShoppingCart className="h-5 w-5" />
          </Button>
          
          {user ? (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium hidden md:block">
                Olá, {user.full_name?.split(' ')[0] || 'Cliente'}
              </span>
              <Button variant="ghost" size="icon" onClick={handleLogout} title="Sair">
                <LogOut className="h-5 w-5 text-red-500" />
              </Button>
            </div>
          ) : (
            /* CORREÇÃO AQUI: Usamos asChild para fundir o Button com o Link */
            <Button variant="outline" size="sm" asChild>
              <Link href="/login">
                <User className="mr-2 h-4 w-4" />
                Entrar
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}