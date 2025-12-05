'use client';

import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { productService } from '@/services/product-service';
import { Header } from '../components/common/Header';
import { ProductCard } from '../components/shop/ProductCard';
import { Button } from '../components/ui/button';

export default function HomePage() {
  // Busca de Produtos
  const { data: products, isLoading, isError } = useQuery({
    queryKey: ['products'],
    queryFn: () => productService.getProducts(0, 50), // Traz 50 iniciais
  });

  // Busca de Categorias (para menu futuro)
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: productService.getCategories,
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Banner / Hero Section Simples */}
        <section className="mb-8 rounded-lg bg-primary/10 p-8 text-center">
          <h1 className="text-4xl font-bold text-primary mb-2">Coleção Exclusiva</h1>
          <p className="text-gray-600">As melhores semi-joias para você brilhar.</p>
        </section>

        {/* Filtros de Categoria (Simples) */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-6">
          <Button variant="default" size="sm">Todos</Button>
          {categories?.map((cat) => (
            <Button key={cat.id} variant="outline" size="sm" className="whitespace-nowrap">
              {cat.name}
            </Button>
          ))}
        </div>

        {/* Estado de Carregamento */}
        {isLoading && (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Estado de Erro */}
        {isError && (
          <div className="text-center text-red-500 py-10">
            Erro ao carregar produtos. Verifique sua conexão com a API.
          </div>
        )}

        {/* Grid de Produtos */}
        {!isLoading && !isError && products && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.length > 0 ? (
              products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))
            ) : (
              <p className="col-span-full text-center text-gray-500">
                Nenhum produto encontrado.
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}