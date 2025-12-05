'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingCart, LogOut, User as UserIcon, LayoutDashboard, Loader2, ChevronDown } from 'lucide-react';
import Cookies from 'js-cookie';

import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar'; // Opcional: Instalar se quiser, ou usar ícone

import { useAuthStore } from '@/store/use-auth-store';
import { authService } from '@/services/auth-service';
import { TOKEN_KEY } from '@/lib/api';

export function Header() {
  const { user, setAuth, logout } = useAuthStore();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(false);
  
  // Estado para controlar a hidratação (evita erro de disparidade Server/Client)
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    // Lógica de Sincronização: Cookie existe mas Store está vazia?
    const token = Cookies.get(TOKEN_KEY);
    if (token && !user) {
      setIsChecking(true);
      authService.getProfile()
        .then((fetchedUser) => {
          setAuth(fetchedUser);
        })
        .catch(() => {
          // Se o token for inválido, fazemos logout limpo
          logout(); 
        })
        .finally(() => {
          setIsChecking(false);
        });
    }
  }, [user, setAuth, logout]);

  const handleLogout = () => {
    authService.logout();
    logout();
    router.refresh();
    router.push('/');
  };

  // Iniciais do nome para o Avatar
  const getInitials = (name: string) => {
    return name
      ?.split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'U';
  };

  return (
    <header className="border-b bg-white sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          {/* Você pode adicionar um ícone de joia aqui depois */}
          <span className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            CidaJoias
          </span>
        </Link>

        {/* Ações da Direita */}
        <div className="flex items-center gap-4">
          
          {/* Carrinho (Sempre visível) */}
          <Button variant="ghost" size="icon" className="relative">
            <ShoppingCart className="h-5 w-5 text-gray-700" />
            {/* Badge de contador futuro */}
            {/* <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full" /> */}
          </Button>
          
          {/* Lógica de Renderização do Usuário */}
          {!isMounted || isChecking ? (
            // Loading State (Skeleton simples)
            <Button variant="ghost" size="sm" disabled>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Carregando...
            </Button>
          ) : user ? (
            // --- USUÁRIO LOGADO ---
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="pl-2 pr-4 gap-2 rounded-full hover:bg-gray-100">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                    {getInitials(user.full_name || user.email)}
                  </div>
                  <span className="text-sm font-medium hidden md:block text-gray-700">
                    {user.full_name?.split(' ')[0] || 'Minha Conta'}
                  </span>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.full_name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                {/* Opção Exclusiva de Admin */}
                {user.role === 'admin' && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/admin/dashboard" className="w-full cursor-pointer font-medium text-purple-600">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Painel Admin
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}

                <DropdownMenuItem asChild>
                  <Link href="/orders/meus-pedidos" className="cursor-pointer">
                    <UserIcon className="mr-2 h-4 w-4" />
                    Meus Pedidos
                  </Link>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem 
                  onClick={handleLogout} 
                  className="text-red-600 focus:text-red-600 cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair da Conta
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            // --- VISITANTE (BOTÃO ENTRAR) ---
            <Button variant="default" size="sm" asChild className="rounded-full px-6">
              <Link href="/login">
                Entrar
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}