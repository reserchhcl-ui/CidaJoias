"use client";

import { useState, useEffect } from "react";
import { ShoppingBag, Menu, Search } from "lucide-react";
import Link from "next/link";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { useCartStore } from "@/store/cart"; // Importação da Store

export default function Header() {
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  // Estado para controlar a hidratação
  const [isMounted, setIsMounted] = useState(false);

  // Hook da store do carrinho
  const openCart = useCartStore((state) => state.openCart);
  const totalItems = useCartStore((state) => state.getTotalItems());

  // useEffect para detectar quando estamos no cliente
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
        scrolled ? "bg-white/80 backdrop-blur-md shadow-sm" : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Mobile Menu Trigger */}
        <button className="md:hidden p-2 text-slate-800">
          <Menu className="w-6 h-6" />
        </button>

        {/* Logo */}
        <Link href="/" className="text-2xl font-serif font-bold tracking-tighter text-slate-900">
          Cida<span className="text-amber-600"> Joias</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex gap-8 items-center font-medium text-sm text-slate-600">
          <Link href="#" className="hover:text-amber-600 transition-colors">Coleções</Link>
          <Link href="#" className="hover:text-amber-600 transition-colors">Lançamentos</Link>
          <Link href="#" className="hover:text-amber-600 transition-colors">Sobre Nós</Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <Search className="w-5 h-5 text-slate-700" />
          </button>
          
          {/* Botão do Carrinho com Fix de Hidratação */}
          <button 
            onClick={openCart}
            className="relative p-2 hover:bg-slate-100 rounded-full transition-colors group"
          >
            <ShoppingBag className="w-5 h-5 text-slate-700 group-hover:text-amber-600 transition-colors" />
            
            {/* Só renderiza o badge se o componente estiver montado no cliente */}
            {isMounted && totalItems > 0 && (
              <span className="absolute top-1 right-0.5 w-4 h-4 bg-amber-600 text-white text-[10px] font-bold flex items-center justify-center rounded-full">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </div>
    </motion.header>
  );
}