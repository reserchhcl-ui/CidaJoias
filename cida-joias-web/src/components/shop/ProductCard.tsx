import Link from 'next/link';
import { Product } from '@/types/product';
import { formatPrice, getImageUrl } from '@/lib/utils';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  // Lógica corrigida: Promoção existe se o preço atual for menor que o de tabela
  const hasDiscount = product.current_price < product.selling_price;
  
  // Imagem: usa image_url direto do schema
  const productWinImage = product.image_url;

  return (
    <Card className="overflow-hidden flex flex-col h-full hover:shadow-lg transition-shadow group">
      <Link href={`/products/${product.id}`} className="cursor-pointer">
        <div className="relative h-48 w-full bg-gray-100 overflow-hidden">
          
          {/* Imagem */}
          <img 
            src={getImageUrl(productWinImage)} 
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          
          {/* Badge de Promoção */}
          {hasDiscount && (
            <Badge className="absolute top-2 right-2 bg-red-600 hover:bg-red-700">
              Promoção
            </Badge>
          )}
        </div>
      </Link>
      
      <CardContent className="flex-1 p-4">
        <div className="mb-2">
          <Link href={`/products/${product.id}`} className="hover:underline">
            <h3 className="font-semibold text-lg line-clamp-1" title={product.name}>
                {product.name}
            </h3>
            {product.category && (
                <span className="text-xs text-muted-foreground">
                    {product.category.name}
                </span>
            )}
          </Link>
        </div>
        
        <p className="text-sm text-gray-500 mb-4 line-clamp-2 min-h-[40px]">
            {product.description || "Sem descrição."}
        </p>
        
        <div className="mt-auto">
          {hasDiscount ? (
            <div className="flex flex-col">
              <span className="text-xs text-gray-400 line-through">
                De: {formatPrice(product.selling_price)}
              </span>
              <span className="text-lg font-bold text-red-600">
                Por: {formatPrice(product.current_price)}
              </span>
            </div>
          ) : (
            <span className="text-lg font-bold text-gray-900">
              {formatPrice(product.selling_price)}
            </span>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-0">
        <Button className="w-full" disabled={product.stock_quantity <= 0}>
            {product.stock_quantity > 0 ? "Adicionar ao Carrinho" : "Esgotado"}
        </Button>
      </CardFooter>
    </Card>
  );
}