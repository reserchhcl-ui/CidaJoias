import { ProductAdmin } from './product';
import { UserProfile } from './auth'
// --- Tipos para Pedidos (Cliente Final) ---
export interface OrderItem {
  id: number;
  product_id: number;
  quantity: number;
  price_at_purchase: number;
  product?: ProductAdmin; // Se o backend expandir ou se fizermos fetch extra
}

export interface Order {
  id: number;
  created_at: string; // Vem como string ISO do backend
  status: string; // 'pending', 'paid', 'shipped', etc.
  total_amount: number;
  items: OrderItem[];
}

// --- Tipos para Consignação (Vendedora) ---
export interface SalesCaseItem {
  product_id: number;
  quantity: number;
  product?: ProductAdmin;
  // O backend pode retornar detalhes do produto aqui se usarmos expand, 
  // mas o schema básico SalesCaseItemResponse tem apenas ids. 
  // O ideal seria o backend retornar o nome, mas buscaremos produtos se necessário.
}

export interface SalesCase {
  id: number;
  sales_rep_id: number;
  loan_date: string;
  return_by_date: string;
  status: 'on_loan' | 'returned' | 'settled' | 'overdue';
  items: SalesCaseItem[];
  sales_rep?: UserProfile;
}