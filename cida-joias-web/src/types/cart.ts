import { Product } from './product';

export interface CartItem extends Product {
  quantity: number;
}

export interface ShippingOption {
  name: string;
  price: number;
  estimated_days: number;
}

export interface Coupon {
  code: string;
  discount_value: number;
  discount_type: 'percentage' | 'fixed';
}

export interface CartSummary {
  subtotal: number;
  shippingTotal: number;
  discountTotal: number;
  total: number;
}