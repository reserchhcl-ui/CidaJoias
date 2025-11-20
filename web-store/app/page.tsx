import Image from "next/image";

// 1. Definição da Interface TypeScript baseada na resposta da sua API
interface Product {
  id: number;
  name: string;
  description: string;
  selling_price: number | string; // Pode vir como string do Decimal Python
  current_price: number | string; // O culpado do erro
  image_url: string | null;
}

// Função para buscar dados (Server Component)
async function getProducts(): Promise<Product[]> {
  // Usando a URL que apareceu no seu log
  const res = await fetch('http://localhost:8000/api/v1/products/', {
    cache: 'no-store', // Para sempre pegar dados frescos (útil em dev)
  });

  if (!res.ok) {
    throw new Error('Falha ao buscar produtos');
  }

  return res.json();
}

export default async function Home() {
  const products = await getProducts();

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-8 text-center">
          Cida Joias - Coleção Exclusiva
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <div 
              key={product.id} 
              className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col"
            >
              {/* Área da Imagem */}
              <div className="relative h-64 w-full bg-gray-200">
                <Image
                  src={product.image_url || "https://via.placeholder.com/400x300?text=Sem+Imagem"}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
                {/* Badge de Promoção se houver desconto */}
                {Number(product.current_price) < Number(product.selling_price) && (
                  <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                    OFERTA
                  </span>
                )}
              </div>

              {/* Detalhes do Produto */}
              <div className="p-5 flex-grow flex flex-col justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-1">
                    {product.name}
                  </h2>
                  <p className="text-gray-500 text-sm mb-4 line-clamp-2">
                    {product.description || "Sem descrição disponível."}
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex flex-col">
                    {/* CORREÇÃO DO ERRO AQUI: Number() */}
                    <span className="text-gray-400 text-sm line-through">
                      {Number(product.selling_price) > Number(product.current_price) 
                        ? `R$ ${Number(product.selling_price).toFixed(2)}`
                        : null}
                    </span>
                    <span className="text-2xl font-bold text-emerald-600">
                      R$ {Number(product.current_price).toFixed(2)}
                    </span>
                  </div>
                  <button className="bg-emerald-600 hover:bg-emerald-700 text-white p-3 rounded-full transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}