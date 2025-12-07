'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingCart, LogOut, User as UserIcon, LayoutDashboard, Loader2, ChevronDown, Store, UserCog } from 'lucide-react';
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

import { useAuthStore } from '@/store/use-auth-store';
import { authService } from '@/services/auth-service';
import { TOKEN_KEY } from '@/lib/api';
import { CartSheet } from '@/components/shop/CartSheet';

export function Header() {
  const { user, setAuth, logout } = useAuthStore();
  const router = useRouter();
  
  const [isMounted, setIsMounted] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [searchTerm, setSearchTerm] = useState(''); // Estado para busca

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const token = Cookies.get(TOKEN_KEY);
    
    if (token && !user) {
      setIsChecking(true);
      authService.getProfile()
        .then((fetchedUser) => {
          setAuth(fetchedUser);
        })
        .catch(() => {
          authService.logout(); 
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
    window.location.href = '/login';
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchTerm)}`);
    }
  };

  const getInitials = (name?: string) => {
    return (name || 'C')
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  if (!isMounted) {
    return (
      <header className="border-b bg-white h-16 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-full flex items-center justify-between">
            <span className="font-bold text-gray-300">Carregando...</span>
        </div>
      </header>
    );
  }

  return (
    <header className="border-b bg-white sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <Store className="h-6 w-6 text-primary group-hover:text-purple-600 transition-colors" />
          <span className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
            CidaJoias
          </span>
        </Link>

        {/* Barra de Busca (Nova) */}
        <div className="hidden md:flex flex-1 max-w-md mx-8">
            <form onSubmit={handleSearch} className="relative w-full">
                {/* Ícone de busca pode ser importado de lucide-react 'Search' se necessário */}
                <input 
                    placeholder="Buscar peças..." 
                    className="w-full pl-4 pr-10 py-2 rounded-full border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </form>
        </div>

        {/* Ações da Direita */}
        <div className="flex items-center gap-4">
          
          {/* Carrinho (Drawer) */}
          <CartSheet />
          
          {/* Menu do Usuário */}
          {isChecking ? (
            <Button variant="ghost" size="sm" disabled>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              <span className="sr-only sm:not-sr-only">Carregando...</span>
            </Button>
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="pl-2 pr-4 gap-2 rounded-full hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs ring-2 ring-white">
                    {getInitials(user.full_name)}
                  </div>
                  <div className="flex flex-col items-start text-xs text-left hidden md:flex">
                    <span className="font-semibold text-slate-700">
                      {user.full_name?.split(' ')[0]}
                    </span>
                    <span className="text-slate-500 capitalize">{user.role === 'sales_rep' ? 'Vendedora' : user.role === 'admin' ? 'Admin' : 'Cliente'}</span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 mt-2">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none truncate">{user.full_name}</p>
                    <p className="text-xs leading-none text-muted-foreground truncate">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                {/* Link Admin */}
                {user.role === 'admin' && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/admin/dashboard" className="w-full cursor-pointer font-medium text-purple-600 focus:text-purple-700 focus:bg-purple-50">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Painel Admin
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}

                {/* Link Vendedora */}
                {user.role === 'sales_rep' && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/sales-cases" className="w-full cursor-pointer font-medium text-blue-600 focus:text-blue-700 focus:bg-blue-50">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Meus Estojos
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                
                {/* --- NOVO ITEM: MINHA CONTA --- */}
                <DropdownMenuItem asChild>
                  <Link href="/account" className="cursor-pointer">
                    <UserCog className="mr-2 h-4 w-4" />
                    Minha Conta
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                  <Link href="/orders/meus-pedidos" className="cursor-pointer">
                    <UserIcon className="mr-2 h-4 w-4" />
                    Meus Pedidos
                  </Link>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem 
                  onClick={handleLogout} 
                  className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair da Conta
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="default" size="sm" asChild className="rounded-full px-6 shadow-md hover:shadow-lg transition-all">
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