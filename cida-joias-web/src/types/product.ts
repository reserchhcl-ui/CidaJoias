export interface Category {
    id: number;
    name: string;
    slug?: string;
  }
  
  export interface ProductImage {
      id: number;
      url: string; // Vem do backend como "/static/..."
      is_main: boolean;
  }
  
  export interface Product {
    id: number;
    name: string;
    description?: string;
    selling_price: number; // Preço "De" (Tabela)
    current_price: number; // Preço "Por" (Final)
    cost_price: number;
    category_id?: number;
    category?: Category;
    barcode?: string;
    stock_quantity: number;
    image_url?: string | null; // Schema usa image_url, não lista de imagens
    is_active?: boolean;
  }
  
  export interface ProductSearchFilters {
    page?: number;
    limit?: number;
    search_term?: string;
    category_id?: number;
    min_price?: number;
    max_price?: number;
    only_promotions?: boolean;
  }