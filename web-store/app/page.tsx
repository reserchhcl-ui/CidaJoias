import { Suspense } from "react";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import ProductCard from "@/components/ProductCard";
import CidaIntelligence from "@/components/CidaIntelligence";
import { Product } from "@/src/lib/types";
import CartSidebar from "@/components/CartSidebar";
// Função para buscar dados da sua API Python
async function getProducts(): Promise<Product[]> {
  // Nota: Em produção, use a variável de ambiente para a URL base
  const res = await fetch('http://127.0.0.1:8000/api/v1/products/', {
    cache: 'no-store', // Garante dados frescos a cada request (bom para e-commerce)
    // ou next: { revalidate: 60 } para cache de 1 minuto
  });

  if (!res.ok) {
    // Isso ativará o error.tsx do Next.js
    throw new Error('Falha ao buscar produtos da API');
  }

  return res.json();
}

export default async function Home() {
  // Fetch de dados acontece no servidor
  const products = await getProducts();

  return (
    <main className="min-h-screen bg-white selection:bg-amber-100 selection:text-amber-900">
      <Header />
      <CartSidebar />
      <Hero />
      {/* Seção de Vitrine Principal */}
      <section className="py-20 container mx-auto px-4">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-3xl font-serif font-bold text-slate-900">Destaques</h2>
            <p className="text-slate-500 mt-2">As peças mais desejadas do momento.</p>
          </div>
          <a href="#" className="text-amber-600 font-medium hover:underline underline-offset-4">
            Ver todos
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* Seção de ML / Inteligência */}
      {/*<CidaIntelligence />*/}

      {/* Footer Simples */}
      <footer className="bg-slate-900 text-white py-12 border-t border-slate-800">
        <div className="container mx-auto px-4 text-center">
          <p className="font-serif text-2xl mb-4">Cida.Joias</p>
          <p className="text-slate-400 text-sm">
            © 2025 Cida Joias. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </main>
  );
}