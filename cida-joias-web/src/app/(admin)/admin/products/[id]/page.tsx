'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { ProductForm } from '@/components/admin/ProductForm';
import { productService } from '@/services/product-service';

export default function EditProductPage() {
  const params = useParams();
  // Assegura que o id é um número
  const productId = Number(params.id);

  // Busca os dados do produto pelo ID
  const { data: product, isLoading, isError } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => productService.getProductById(productId),
    enabled: !!productId, // Só roda se tiver ID
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-gray-500">Carregando dados do produto...</span>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="p-8 text-center text-red-500">
        Erro ao carregar produto. Verifique se ele existe ou tente novamente.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Editar Produto</h1>
        <p className="text-muted-foreground">
          Alterar informações do produto #{product.id} - {product.name}
        </p>
      </div>

      <ProductForm initialData={product} />
    </div>
  );
}