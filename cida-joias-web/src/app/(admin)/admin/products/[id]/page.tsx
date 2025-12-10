'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { ProductForm } from '@/components/admin/ProductForm';
import { productService } from '@/services/product-service';

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = Number(params.id);
  const queryClient = useQueryClient();

  // 1. Buscar Produto (Admin Route)
  const { data: product, isLoading: isLoadingProduct } = useQuery({
    queryKey: ['admin-product', productId],
    queryFn: () => productService.getProductAdminById(productId),
    enabled: !!productId,
  });

  // 2. CORREÇÃO: Buscar Categorias também na edição
  const { data: categories, isLoading: isLoadingCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: productService.getCategories,
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => productService.updateProduct(productId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success('Produto atualizado!');
      router.push('/admin/products');
    },
    onError: () => toast.error('Erro ao atualizar produto.'),
  });

  if (isLoadingProduct || isLoadingCategories) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!product) return <div>Produto não encontrado.</div>;

  return (
    <div className="max-w-4xl mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Editar Produto</h1>
        <p className="text-slate-500">#{product.id} - {product.name}</p>
      </div>

      <ProductForm 
        initialData={product}
        categories={categories || []} // Passa as categorias
        isSubmitting={updateMutation.isPending}
        onSubmit={(data) => updateMutation.mutate(data)}
        onCancel={() => router.back()}
      />
    </div>
  );
}