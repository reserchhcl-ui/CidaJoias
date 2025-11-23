// types/index.ts

export interface Product {
  id: number;
  name: string;
  description: string | null;
  selling_price: number; // Preço original ("De")
  current_price: number; // Preço real de venda ("Por") - calculado pelo backend
  stock_quantity: number;
  image_url: string | null;
  barcode?: string | null;
  // cost_price geralmente não expomos no frontend público por segurança,
  // mas se a API mandar, podemos tipar como opcional.
  cost_price?: number; 
}

// Interface para a resposta paginada (se sua API retornar dessa forma no futuro)
// Por enquanto, sua API retorna array direto: List[schemas.Product]
export type ProductListResponse = Product[];