'use client';

import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import { Product } from '@/types/product';
import { formatPrice, getImageUrl } from '@/lib/utils';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCartStore } from '@/store/use-cart-store';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);

  // Lógica de Promoção
  const hasDiscount = product.current_price < product.selling_price;
  
  // Handler para adicionar sem navegar para a página de detalhes
  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault(); // Evita abrir o Link
    e.stopPropagation(); // Evita propagar o clique
    addItem(product);
  };

  return (
    <Card className="overflow-hidden flex flex-col h-full hover:shadow-lg transition-shadow group border-slate-200">
      <Link href={`/products/${product.id}`} className="cursor-pointer flex-1 flex flex-col">
        <div className="relative h-52 w-full bg-slate-100 overflow-hidden">
          {/* Imagem */}
          <img 
            src={getImageUrl(product.image_url)} 
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          
          {/* Badge de Promoção */}
          {hasDiscount && (
            <Badge className="absolute top-2 right-2 bg-red-600 hover:bg-red-700">
              Promoção
            </Badge>
          )}
        </div>
        
        <CardContent className="flex-1 p-4 flex flex-col">
          <div className="mb-2">
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                  {product.category?.name || "Jóia"}
              </span>
              <h3 className="font-semibold text-lg line-clamp-1 text-slate-900 mt-1" title={product.name}>
                  {product.name}
              </h3>
          </div>
          
          <div className="mt-auto">
            {hasDiscount ? (
              <div className="flex flex-col">
                <span className="text-xs text-slate-400 line-through">
                  De: {formatPrice(product.selling_price)}
                </span>
                <span className="text-lg font-bold text-red-600">
                  Por: {formatPrice(product.current_price)}
                </span>
              </div>
            ) : (
              <span className="text-lg font-bold text-slate-900">
                {formatPrice(product.selling_price)}
              </span>
            )}
            <p className="text-xs text-slate-500 mt-1 font-medium">
               {product.stock_quantity > 0 ? 'Em estoque' : 'Indisponível'}
            </p>
          </div>
        </CardContent>
      </Link>
      
      <CardFooter className="p-4 pt-0">
        <Button 
            className="w-full gap-2 font-semibold" 
            disabled={product.stock_quantity <= 0}
            onClick={handleAddToCart}
        >
            <ShoppingCart className="h-4 w-4" />
            {product.stock_quantity > 0 ? "Adicionar" : "Esgotado"}
        </Button>
      </CardFooter>
    </Card>
  );
}