'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Loader2, SlidersHorizontal } from 'lucide-react';
import { Suspense, useMemo } from 'react';

import { ProductFilters } from '@/components/shop/ProductFilters';
import { ProductCard } from '@/components/shop/ProductCard';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { productService } from '@/services/product-service';
import { ProductSearchFilters } from '@/types/product';

// Componente interno que usa useSearchParams (deve estar dentro de Suspense)
function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 1. LER URL: Converter Query Params para objeto de Filtros
  const filters = useMemo((): ProductSearchFilters => {
    return {
      search_term: searchParams.get('q') || searchParams.get('search_term') || '',
      min_price: Number(searchParams.get('min_price')) || 0,
      max_price: searchParams.get('max_price') ? Number(searchParams.get('max_price')) : 2000,
      category_id: searchParams.get('category_id') ? Number(searchParams.get('category_id')) : undefined,
      only_promotions: searchParams.get('only_promotions') === 'true',
    };
  }, [searchParams]);

  // 2. BUSCAR DADOS: React Query dispara sempre que 'filters' muda
  const { data: products, isLoading, isError } = useQuery({
    queryKey: ['products-search', filters],
    queryFn: () => productService.searchProducts(filters),
    placeholderData: (prev) => prev, // Mantém dados antigos enquanto carrega novos
  });

  // 3. ATUALIZAR URL: Função chamada pelo componente filho quando o user mexe nos filtros
  const handleFilterChange = (newFilters: ProductSearchFilters) => {
    const params = new URLSearchParams();

    if (newFilters.search_term) params.set('q', newFilters.search_term);
    if (newFilters.min_price && newFilters.min_price > 0) params.set('min_price', newFilters.min_price.toString());
    if (newFilters.max_price && newFilters.max_price < 2000) params.set('max_price', newFilters.max_price.toString());
    if (newFilters.category_id) params.set('category_id', newFilters.category_id.toString());
    if (newFilters.only_promotions) params.set('only_promotions', 'true');

    // Atualiza a URL sem recarregar a página (scroll: false mantém a posição)
    router.replace(`/search?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="flex flex-col md:flex-row gap-8">
      {/* Sidebar Desktop */}
      <aside className="hidden md:block w-64 flex-shrink-0">
        <div className="sticky top-24">
            <ProductFilters filters={filters} onFilterChange={handleFilterChange} />
        </div>
      </aside>

      {/* Conteúdo Principal */}
      <div className="flex-1">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
              Resultados da Busca
              {products && <span className="ml-2 text-sm font-normal text-gray-500">({products.length} itens)</span>}
          </h1>

          {/* Filtro Mobile */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="md:hidden gap-2">
                <SlidersHorizontal className="h-4 w-4" /> Filtros
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
                <div className="mt-6">
                  <ProductFilters filters={filters} onFilterChange={handleFilterChange} />
                </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Grid de Resultados */}
        {isLoading && !products ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : isError ? (
          <div className="text-center py-20 text-red-500">
            Erro ao buscar produtos. Tente novamente.
          </div>
        ) : products?.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 rounded-lg">
            <p className="text-gray-500 text-lg mb-4">Nenhum produto encontrado.</p>
            <Button variant="link" onClick={() => handleFilterChange({})}>Limpar filtros</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products?.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Wrapper Principal (Obrigatório Suspense ao usar useSearchParams)
export default function SearchPage() {
  return (
    <div className="container mx-auto px-4 py-8 min-h-screen">
      <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
        <SearchContent />
      </Suspense>
    </div>
  );
}