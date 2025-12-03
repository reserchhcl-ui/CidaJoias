"use client"; // Importante para useEffect e state

import { useState, useEffect } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import ProductCard from "@/components/ProductCard"; // Reutilizamos o Card!
import { Product } from "@/src/lib/types";

export default function CidaIntelligence() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        // Chama o endpoint de recomendações do backend
        const res = await fetch('http://127.0.0.1:8000/api/v1/recommendations/trending?limit=4');
        if (res.ok) {
          const data = await res.json();
          setProducts(data);
        }
      } catch (error) {
        console.error("Falha ao carregar inteligência Cida", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, []);

  if (!loading && products.length === 0) return null; // Não mostra a seção se não houver produtos

  return (
    <section className="py-20 bg-slate-50 border-y border-slate-200/50">
      <div className="container mx-auto px-4">
        {/* Cabeçalho da Seção */}
        <div className="flex flex-col items-center text-center mb-12 space-y-3">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-100 to-amber-50 px-4 py-1.5 rounded-full border border-amber-100">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">Cida Intelligence</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-slate-900">
            Escolhidos para Você
          </h2>
          <p className="text-slate-600 max-w-xl">
            Nossos algoritmos selecionaram estas peças baseadas nas tendências mais recentes da nossa coleção.
          </p>
        </div>

        {/* Grid de Produtos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10">
          {loading ? (
            // Esqueleto de Loading (Skeleton UI)
            [1, 2, 3, 4].map((item) => (
              <div key={item} className="flex flex-col gap-3 animate-pulse">
                <div className="aspect-[4/5] bg-slate-200 rounded-xl w-full"></div>
                <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                <div className="h-4 bg-slate-200 rounded w-1/2"></div>
              </div>
            ))
          ) : (
            // Produtos Reais vindos da API de ML
            products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))
          )}
        </div>
      </div>
    </section>
  );
}