// src/types/sales-case.ts

export type SalesCaseStatus = 'open' | 'on_loan' | 'closed' | 'returned';

export interface SalesCaseProduct {
  id: number;
  name: string;
  image_url: string | null;
  // Adicione preço se o backend mandar, útil para valor total do estojo
  selling_price?: number; 
}

export interface SalesCaseItem {
  product_id: number;
  quantity: number;
  product?: SalesCaseProduct; // O objeto aninhado importante
}

export interface SalesCase {
  id: number;
  code: string;
  sales_rep_id: number;
  sales_rep_name?: string; // Se o backend mandar o nome da vendedora
  status: SalesCaseStatus;
  created_at: string;
  items: SalesCaseItem[];
}

export interface CreateCaseDTO {
  code: string;
  sales_rep_id: number;
}