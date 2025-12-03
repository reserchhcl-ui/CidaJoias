"use client";
import { useState } from 'react';
import { ProductService } from '@/src/lib/api/apiClient';
import { useQuery } from '@tanstack/react-query'; // Sugestão: React Query para cache

export default function AdvancedFilter({ onResults }: { onResults: (products: any[]) => void }) {
  const [filters, setFilters] = useState({
    min_price: 0,
    max_price: 2000,
    only_promotions: false,
    search_term: ''
  });

  const handleSearch = async () => {
    try {
      // O backend agora espera um objeto ProductFilter no body do POST
      const products = await ProductService.search(filters);
      onResults(products);
    } catch (error) {
      console.error("Erro na busca avançada", error);
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow space-y-4">
      <input 
        type="text" 
        placeholder="Buscar (ex: anel ouro)" 
        className="w-full border p-2 rounded"
        onChange={(e) => setFilters({...filters, search_term: e.target.value})}
      />
      <div className="flex gap-2">
        <input 
          type="number" 
          placeholder="Min R$" 
          className="w-1/2 border p-2"
          onChange={(e) => setFilters({...filters, min_price: Number(e.target.value)})}
        />
        <input 
          type="number" 
          placeholder="Max R$" 
          className="w-1/2 border p-2"
          onChange={(e) => setFilters({...filters, max_price: Number(e.target.value)})}
        />
      </div>
      <label className="flex items-center gap-2">
        <input 
          type="checkbox" 
          checked={filters.only_promotions}
          onChange={(e) => setFilters({...filters, only_promotions: e.target.checked})}
        />
        <span>Apenas Promoções</span>
      </label>
      <button 
        onClick={handleSearch}
        className="w-full bg-amber-600 text-white py-2 rounded hover:bg-amber-700"
      >
        Filtrar Resultados
      </button>
    </div>
  );
}