"use client";
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ProductService } from '@/src/lib/api/apiClient';
import { Product } from '@/src/lib/types';
import ProductCard from '@/components/ProductCard';
import Header from '@/components/Header';
import { Loader2 } from 'lucide-react';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q'); // Pega o ?q= da URL
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (query) {
      const doSearch = async () => {
        setLoading(true);
        try {
          // Usa o endpoint de busca avançada do backend
          const results = await ProductService.search({ search_term: query });
          setProducts(results);
        } catch (e) {
          console.error(e);
        } finally {
          setLoading(false);
        }
      };
      doSearch();
    }
  }, [query]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="container mx-auto px-4 py-24">
        <h1 className="text-2xl font-serif font-bold text-slate-900 mb-6">
          Resultados para: <span className="text-amber-600">"{query}"</span>
        </h1>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin w-8 h-8 text-slate-400" /></div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
            <p className="text-slate-500">Nenhum produto encontrado.</p>
          </div>
        )}
      </main>
    </div>
  );
}