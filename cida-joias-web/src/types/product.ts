// src/types/product.ts

// --- CATEGORIAS (Agora Recursivas) ---
export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string; // Novo
  parent_id?: number | null; // Novo
  sub_categories?: Category[]; // Novo (Recursivo)
}

// --- PRODUTOS ---

// Base: Dados visíveis para todos
export interface ProductPublic {
  id: number;
  name: string;
  description?: string;
  price: number;          // Preço "de" (opcional visualmente)
  selling_price: number;  // Preço de venda real
  current_price: number;
  stock_quantity: number; // Disponível para compra
  barcode: string;
  image_url?: string;
  category_id: number;
  category?: Category;
  is_active: boolean;
}

// Admin: Herda do público e adiciona dados sensíveis
export interface ProductAdmin extends ProductPublic {
  cost_price: number;        // Apenas Backoffice
  supplier_ref?: string;     // Apenas Backoffice (Novo)
  on_loan_quantity: number;  // Apenas Backoffice
  total_stock: number;       // (Opcional: soma de stock + loan)
}

// Tipo usado nos formulários de criação/edição
export type ProductFormValues = Omit<ProductAdmin, 'id' | 'category' | 'total_stock' | 'is_active'>;

// --- DASHBOARD STATS (Novo) ---
export interface InventoryStats {
  total_stock_quantity: number;
  total_on_loan_quantity: number;
  total_stock_value: number;
  total_on_loan_value: number;
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