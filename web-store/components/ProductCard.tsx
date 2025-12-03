"use client";

import Image from "next/image";
import { Product } from "@/src/lib/types";
import { ShoppingCart, ImageOff } from "lucide-react"; // Adicionei ImageOff para erro visual
import { useCartStore } from "@/src/lib/store/cart";
import { useState } from "react";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);
  const [imgError, setImgError] = useState(false);
  
  const hasDiscount = product.current_price < product.selling_price;
  
  const formatPrice = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  // --- Lógica de Tratamento de Imagem ---
  const getImageUrl = (url: string | null) => {
    if (!url) return null; // Retorna null para ativar o fallback

    // Se for URL externa (começa com http), retorna ela mesma
    if (url.startsWith("http") || url.startsWith("https")) return url;

    // 1. Normalização para Windows: Troca backslash (\) por slash (/)
    // 2. Remove espaços extras e barras iniciais
    let path = url.trim().replace(/\\/g, '/').replace(/^\/+/, '');

    // 3. Garante o prefixo da pasta
    if (!path.startsWith("Produtos_Images")) {
      path = `Produtos_Images/${path}`;
    }

    // 4. Codifica URI (Resolve os espaços "Imagem do Produto")
    // Dividimos por '/' para não codificar as barras separadoras
    path = path.split('/').map(segment => encodeURIComponent(segment)).join('/');

    // 5. Retorna caminho absoluto para a pasta public
    return `/${path}`;
  };

  const imageSrc = getImageUrl(product.image_url);
  // Define se é uma imagem local para pular a otimização (resolve erros de 404 em dev)
  const isLocalImage = imageSrc?.startsWith("/"); 
  const fallbackImage = "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&q=80";

  return (
    <div className="group relative flex flex-col gap-3">
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-slate-100">
        {hasDiscount && (
          <span className="absolute top-3 left-3 z-10 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            OFERTA
          </span>
        )}
        
        {imgError || !imageSrc ? (
          <div className="flex h-full w-full items-center justify-center bg-slate-200 text-slate-400">
            <ImageOff className="h-10 w-10" />
          </div>
        ) : (
          <Image
            src={imageSrc}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            // [SOLUÇÃO CRÍTICA]: Pula a otimização para arquivos locais, evitando o erro 404 do servidor
            unoptimized={isLocalImage} 
            onError={() => setImgError(true)}
          />
        )}
        
        <button 
          onClick={() => addItem(product)}
          className="absolute bottom-4 right-4 translate-y-4 opacity-0 shadow-lg bg-white p-3 rounded-full text-slate-900 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 hover:bg-amber-600 hover:text-white focus:opacity-100 focus:translate-y-0"
          aria-label="Adicionar ao carrinho"
        >
          <ShoppingCart className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-1">
        <h3 className="font-medium text-slate-900 text-lg leading-tight">{product.name}</h3>
        <p className="text-sm text-slate-500 line-clamp-1">{product.description}</p>
        
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-lg font-bold text-slate-900">
            {formatPrice(product.current_price)}
          </span>
          
          {hasDiscount && (
            <span className="text-sm text-slate-400 line-through decoration-slate-400/50">
              {formatPrice(product.selling_price)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}