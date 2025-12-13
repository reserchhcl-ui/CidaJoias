// src/types/order.ts

export enum OrderStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  PAID = 'paid_order',
}

export enum PaymentStatus {
  PENDING = 'pending_pay',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

// Interface para o Endereço que vem aninhado no pedido
export interface OrderAddress {
  id: number;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zip_code: string;
}

// Interface para o Produto dentro do item (Snapshot)
export interface OrderProductSnapshot {
  id: number;
  name: string;
  image_url?: string;
}

// Interface do Item do Pedido
export interface OrderItem {
  id: number;
  product_id: number;
  quantity: number;
  // Backend envia Float/Number para preço unitário
  price_at_purchase: number; 
  // Agora temos o objeto produto aninhado
  product?: OrderProductSnapshot; 
}

// Interface Principal do Pedido
export interface Order {
  id: number;
  user_id: number;
  status: OrderStatus;
  payment_status: PaymentStatus;
  created_at: string; // ISO Date String

  // O Backend envia Decimals como String ("191.00") para precisão
  // Tipamos como string | number para facilitar, mas o ideal é esperar string
  subtotal: string | number;
  shipping_cost: string | number;
  applied_discount: string | number;
  total_amount: string | number;

  items: OrderItem[];
  
  // Agora é um objeto completo, não apenas um ID
  shipping_address?: OrderAddress;
}

// Filtros para o Admin (Mantém igual)
export interface OrderFilter {
  status?: string;
  payment_status?: string;
  customer_email?: string;
  date_start?: string;
  date_end?: string;
}