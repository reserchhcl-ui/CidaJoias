// src/types/index.ts
import type { UserRole } from '@/src/lib/api/models/UserRole';

export interface Category {
  id: number;
  name: string;
  slug: string;
}

export interface Product {
  id: number;
  name: string;
  description: string | null;
  selling_price: number; // Preço original ("De")
  current_price: number; // Preço atual ("Por")
  stock_quantity: number;
  image_url: string | null;
  barcode?: string | null;
  category?: Category;
}

// Interface para Filtros de Busca Avançada
export interface ProductFilter {
  search_term?: string;
  min_price?: number;
  max_price?: number;
  category_id?: number;
  only_promotions?: boolean;
}

// Interface de Endereço (Consistente com o Backend)
export interface Address {
  id: number;
  name: string; // Apelido: "Minha Casa", "Trabalho"
  recipient_name: string;
  zip_code: string;
  street: string;
  number: string;
  city: string;
  state: string;
  is_default: boolean;
}

export interface User {
    email: string;
    id: number;
    role: UserRole;
}

// Opções de Frete retornadas pela simulação
export interface ShippingOption {
  name: string; // "PAC", "SEDEX"
  price: number;
  estimated_days: number;
}

// Resposta da validação de cupom
export interface CouponValidationResponse {
  valid: boolean;
  discount_amount: number;
  new_total: number;
}

// Payload de Pagamento (Mock)
export interface PaymentPayload {
  amount: number;
  card_number: string;
  card_holder: string;
  expiry: string;
  cvv: string;
  installments: number;
}