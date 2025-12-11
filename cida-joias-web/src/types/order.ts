// src/types/order.ts

export enum OrderStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export enum PaymentStatus {
  PENDING = 'pending_pay',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export interface OrderItem {
  id: number;
  product_id: number;
  product_name: string; // O backend deve enviar o nome snapshot ou via join
  quantity: number;
  unit_price: number;
  subtotal: number;
  image_url?: string;
}

export interface Order {
  id: number;
  user_id: number;
  status: OrderStatus;
  payment_status: PaymentStatus;
  total_amount: number;
  created_at: string; // ISO Date
  updated_at: string;
  items: OrderItem[];
  // Campos de endereço (se o backend retornar achatado ou em objeto aninhado)
  shipping_address?: string; 
}

// Filtros para o Admin (POST /search)
export interface OrderFilter {
  status?: string;
  payment_status?: string;
  customer_email?: string;
  date_start?: string;
  date_end?: string;
}