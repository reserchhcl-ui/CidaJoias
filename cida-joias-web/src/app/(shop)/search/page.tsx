'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Loader2, SlidersHorizontal } from 'lucide-react';
import { Suspense, useMemo, useCallback } from 'react'; // Adicionado useCallback

import { ProductFilters } from '@/components/shop/ProductFilters';
import { ProductCard } from '@/components/shop/ProductCard';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from '@/components/ui/sheet';
import { productService } from '@/services/product-service';
import { ProductSearchFilters } from '@/types/product';

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 1. LER URL
  const filters = useMemo((): ProductSearchFilters => {
    return {
      search_term: searchParams.get('q') || searchParams.get('search_term') || '',
      min_price: Number(searchParams.get('min_price')) || 0,
      max_price: searchParams.get('max_price') ? Number(searchParams.get('max_price')) : 2000,
      category_id: searchParams.get('category_id') ? Number(searchParams.get('category_id')) : undefined,
      only_promotions: searchParams.get('only_promotions') === 'true',
    };
  }, [searchParams]);

  // 2. BUSCAR DADOS
  const { data: products, isLoading, isError } = useQuery({
    queryKey: ['products-search', filters],
    queryFn: () => productService.searchProductsPublic(filters),
    placeholderData: (prev) => prev,
  });

  // 3. ATUALIZAR URL (CORRIGIDO)
  // Usamos useCallback para que a função não seja recriada a cada render
  const handleFilterChange = useCallback((newFilters: ProductSearchFilters) => {
    const params = new URLSearchParams();

    // Reconstrói os parametros baseados no input
    if (newFilters.search_term) params.set('q', newFilters.search_term);
    if (newFilters.min_price && newFilters.min_price > 0) params.set('min_price', newFilters.min_price.toString());
    if (newFilters.max_price && newFilters.max_price < 2000) params.set('max_price', newFilters.max_price.toString());
    if (newFilters.category_id) params.set('category_id', newFilters.category_id.toString());
    if (newFilters.only_promotions) params.set('only_promotions', 'true');

    // --- CORREÇÃO DO LOOP INFINITO ---
    const currentString = searchParams.toString();
    const newString = params.toString();

    // Se a string da URL nova for IDÊNTICA à atual, não faz nada.
    // Isso quebra o ciclo se o componente filho disparar o evento sem mudanças reais.
    if (currentString === newString) {
      return;
    }

    router.replace(`/search?${newString}`, { scroll: false });
  }, [searchParams, router]); // Dependências cruciais

  return (
    <div className="flex flex-col md:flex-row gap-8">
      {/* Sidebar Desktop */}
      <aside className="hidden md:block w-64 flex-shrink-0">
        <div className="sticky top-24">
            <ProductFilters 
                filters={filters} 
                onFilterChange={handleFilterChange} 
                idPrefix="desktop" 
            />
        </div>
      </aside>

      {/* Conteúdo Principal */}
      <div className="flex-1">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Resultados da Busca</h1>

          {/* Filtro Mobile */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="md:hidden gap-2">
                <SlidersHorizontal className="h-4 w-4" /> Filtros
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
                <SheetHeader>
                    <SheetTitle>Filtros de Busca</SheetTitle>
                </SheetHeader>
                
                <div className="flex flex-col gap-1.5 p-4">
                  <ProductFilters 
                    filters={filters} 
                    onFilterChange={handleFilterChange} 
                    idPrefix="mobile" 
                  />
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
            {/* O botão de limpar passa um objeto vazio */}
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

export default function SearchPage() {
  return (
    <div className="container mx-auto px-4 py-8 min-h-screen">
      <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
        <SearchContent />
      </Suspense>
    </div>
  );
}