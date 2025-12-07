'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Loader2, ArrowLeft, ShoppingCart, Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useCartStore } from '@/store/use-cart-store';
import { Button } from '../../../../components/ui/button';
import { Badge } from '../../../../components/ui/badge';
import { Separator } from '../../../../components/ui/separator';


import { productService } from '@/services/product-service';
import { formatPrice, getImageUrl } from '@/lib/utils';

export default function ProductDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const addItem = useCartStore((state) => state.addItem);
  // Garante que o ID seja numérico
  const productId = Number(params.id);

  const { data: product, isLoading, isError } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => productService.getProductById(productId),
    enabled: !!productId,
  });

  const handleAddToCart = () => {
    if (product) {
      addItem(product);
    // Futuramente integraremos com o Zustand aqui
    toast.success(`"${product?.name}" adicionado ao carrinho!`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <AlertCircle className="h-12 w-12 text-red-500" />
          <h2 className="text-xl font-semibold text-gray-900">Produto não encontrado</h2>
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>
        </div>
      </div>
    );
  }

  // Lógica de Promoção
  const hasDiscount = product.current_price < product.selling_price;
  const discountPercentage = hasDiscount 
    ? Math.round(((product.selling_price - product.current_price) / product.selling_price) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-10">


      <main className="container mx-auto px-4 py-8">
        {/* Botão Voltar */}
        <Button 
          variant="ghost" 
          className="mb-6 pl-0 hover:pl-2 transition-all"
          onClick={() => router.back()}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para a loja
        </Button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 bg-white p-6 md:p-8 rounded-xl shadow-sm">
          
          {/* Coluna da Esquerda: Imagem */}
          <div className="relative aspect-square md:aspect-[4/5] bg-gray-100 rounded-lg overflow-hidden border">
            <img 
              src={getImageUrl(product.image_url)} 
              alt={product.name}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
            />
            {hasDiscount && (
              <Badge className="absolute top-4 right-4 bg-red-600 text-lg px-3 py-1">
                -{discountPercentage}% OFF
              </Badge>
            )}
          </div>

          {/* Coluna da Direita: Detalhes */}
          <div className="flex flex-col">
            <div className="mb-2">
              <Badge variant="outline" className="text-muted-foreground mb-2">
                {product.category?.name || "Jóia"}
              </Badge>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
                {product.name}
              </h1>
              {product.barcode && (
                <span className="text-xs text-gray-400 mt-1 block">
                  Cód: {product.barcode}
                </span>
              )}
            </div>

            <div className="mt-6 mb-8">
              {hasDiscount ? (
                <div className="space-y-1">
                  <span className="text-lg text-gray-400 line-through block">
                    {formatPrice(product.selling_price)}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-4xl font-bold text-red-600">
                      {formatPrice(product.current_price)}
                    </span>
                  </div>
                  <p className="text-sm text-red-600 font-medium bg-red-50 inline-block px-2 py-1 rounded">
                    Economize {formatPrice(product.selling_price - product.current_price)}
                  </p>
                </div>
              ) : (
                <span className="text-4xl font-bold text-gray-900">
                  {formatPrice(product.selling_price)}
                </span>
              )}
              <p className="text-sm text-gray-500 mt-2">
                Em até 12x de {formatPrice(product.current_price / 12)}
              </p>
            </div>

            <Separator className="my-6" />

            <div className="prose prose-sm text-gray-600 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Sobre a peça</h3>
              <p className="whitespace-pre-line leading-relaxed">
                {product.description || "Sem descrição disponível para este produto."}
              </p>
            </div>

            <div className="mt-auto space-y-4">
              {product.stock_quantity > 0 ? (
                <div className="flex items-center gap-2 text-green-600 mb-2">
                  <Check className="h-4 w-4" />
                  <span className="text-sm font-medium">Estoque disponível ({product.stock_quantity} un)</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-600 mb-2">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Produto esgotado</span>
                </div>
              )}

              <Button 
                size="lg" 
                className="w-full text-lg h-14" 
                onClick={handleAddToCart}
                disabled={product.stock_quantity <= 0}
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                Adicionar ao Carrinho
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}