'use client';

import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react'; // Importar Loader

import { ProductForm } from '@/components/admin/ProductForm';
import { productService } from '@/services/product-service';
const EMPTY_CATEGORIES: any[] = [];
export default function NewProductPage() {
  const router = useRouter();
  
  // 1. CORREÇÃO: Buscar as categorias aqui!
  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: productService.getCategories,
  });
  
  const createMutation = useMutation({
    mutationFn: productService.createProduct,
    onSuccess: () => {
      toast.success('Produto criado com sucesso!');
      router.push('/admin/products');
    },
    onError: (error: any) => {
        const msg = error.response?.data?.detail || 'Erro ao criar produto.';
        toast.error(msg);
    },
  });

  if (isLoading) {
    return (
        <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-slate-500">Carregando categorias...</span>
        </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Novo Produto</h1>
        <p className="text-slate-500">Preencha os dados abaixo para cadastrar um item.</p>
      </div>

      <ProductForm 
        categories={categories || EMPTY_CATEGORIES} // Passa as categorias para o form
        isSubmitting={createMutation.isPending}
        onSubmit={(data) => createMutation.mutate(data)}
        onCancel={() => router.back()}
      />
    </div>
  );
}