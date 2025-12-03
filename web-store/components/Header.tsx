"use client";

import { useState, useEffect } from "react";
import { ShoppingBag, Menu, Search, User, LogOut, MapPin, Package } from "lucide-react";
import Link from "next/link";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { useCartStore } from "@/src/lib/store/cart";
import { useAuth } from "@/contexts/AuthContext"; // Importamos o contexto de Auth
import { useRouter } from "next/navigation";
export default function Header() {
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const q = formData.get('q');
    if (q) router.push(`/search?q=${q}`);
  };
    // No JSX, substitua o botão de busca estático por um form:
  <form onSubmit={handleSearch} className="hidden sm:block relative">
    <input 
      name="q" 
      placeholder="Buscar..." 
      className="pl-4 pr-10 py-1.5 rounded-full bg-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 w-48 transition-all focus:w-64" 
    />
    <Search className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2" />
  </form>
  // Hooks da Store e Auth
  const openCart = useCartStore((state) => state.openCart);
  const totalItems = useCartStore((state) => state.getTotalItems());
  const { user, isAuthenticated, logout } = useAuth(); // Dados do usuário

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() ?? 0;
    if (latest > previous && latest > 150) {
      setHidden(true);
    } else {
      setHidden(false);
    }
    setScrolled(latest > 50);
  });

  return (
    <motion.header
      variants={{
        visible: { y: 0 },
        hidden: { y: "-100%" },
      }}
      animate={hidden ? "hidden" : "visible"}
      transition={{ duration: 0.35, ease: "easeInOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-300 ${
        scrolled ? "bg-white/90 backdrop-blur-md shadow-sm" : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Mobile Menu Trigger */}
        <button className="md:hidden p-2 text-slate-800">
          <Menu className="w-6 h-6" />
        </button>

        {/* Logo */}
        <Link href="/" className="text-2xl font-serif font-bold tracking-tighter text-slate-900">
          Cida<span className="text-amber-600">.</span>Joias
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex gap-8 items-center font-medium text-sm text-slate-600">
          <Link href="#" className="hover:text-amber-600 transition-colors">Coleções</Link>
          <Link href="#" className="hover:text-amber-600 transition-colors">Lançamentos</Link>
          <Link href="#" className="hover:text-amber-600 transition-colors">Sobre Nós</Link>
        </nav>

        {/* Actions (Direita) */}
        <div className="flex items-center gap-2 md:gap-4">
          
          {/* Busca (Apenas visual por enquanto) */}
          <button className="p-2 hover:bg-slate-100 rounded-full transition-colors hidden sm:block">
            <Search className="w-5 h-5 text-slate-700" />
          </button>

          {/* --- ÁREA DO USUÁRIO --- */}
          {isMounted && (
            isAuthenticated ? (
              // Usuário Logado: Dropdown Menu
              <div className="relative group">
                <button className="p-2 hover:bg-slate-100 rounded-full transition-colors flex items-center gap-2">
                  <User className="w-5 h-5 text-slate-700" />
                  {/* Nome do usuário em telas maiores */}
                  <span className="hidden md:block text-sm font-medium text-slate-700 max-w-[100px] truncate">
                    {user?.email.split('@')[0]}
                  </span>
                </button>

                {/* Dropdown Content */}
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all transform origin-top-right scale-95 group-hover:scale-100">
                  <div className="p-4 border-b border-slate-50">
                    <p className="text-xs text-slate-500 font-medium">Logado como</p>
                    <p className="text-sm font-bold text-slate-900 truncate">{user?.email}</p>
                  </div>
                  
                  <div className="py-2">
                    <Link href="/profile/addresses" className="flex items-center gap-3 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-amber-600 transition-colors">
                      <MapPin className="w-4 h-4" />
                      Meus Endereços
                    </Link>
                    <Link href="/orders/meus-pedidos" className="flex items-center gap-3 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-amber-600 transition-colors">
                      <Package className="w-4 h-4" />
                      Meus Pedidos
                    </Link>
                  </div>

                  <div className="border-t border-slate-50 py-2">
                    <button 
                      onClick={logout}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      Sair
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              // Visitante: Link para Login
              <div className="flex items-center gap-2">
                <Link 
                  href="/auth/login" 
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-700"
                  title="Entrar ou Cadastrar"
                >
                  <User className="w-5 h-5" />
                </Link>
              </div>
            )
          )}

          {/* Carrinho */}
          <button 
            onClick={openCart}
            className="relative p-2 hover:bg-slate-100 rounded-full transition-colors group"
          >
            <ShoppingBag className="w-5 h-5 text-slate-700 group-hover:text-amber-600 transition-colors" />
            {isMounted && totalItems > 0 && (
              <span className="absolute top-1 right-0.5 w-4 h-4 bg-amber-600 text-white text-[10px] font-bold flex items-center justify-center rounded-full animate-in zoom-in">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </div>
    </motion.header>
  );
}