import api from '@/lib/api';
import { CartItem, ShippingOption, Coupon } from '@/types/cart';

export const checkoutService = {
  // Simular Frete
  simulateShipping: async (zipCode: string, items: CartItem[]): Promise<ShippingOption[]> => {
    // O backend espera { zip_code: string, items: [{product_id, quantity}] }
    const payload = {
      zip_code: zipCode.replace(/\D/g, ''), // Remove formatação
      items: items.map(item => ({
        product_id: item.id,
        quantity: item.quantity
      }))
    };
    
    const response = await api.post<ShippingOption[]>('/shipping/simulate', payload);
    return response.data;
  },

  // Validar Cupom
  validateCoupon: async (code: string, cartTotal: number): Promise<Coupon> => {
    // Backend: GET /coupons/validate/{code}?value={cart_total}
    const response = await api.get<any>(`/coupons/validate/${code}?value=${cartTotal}`);
    
    // Adaptando a resposta do backend para nosso frontend
    return {
      code: response.data.code,
      discount_value: response.data.discount_value,
      discount_type: response.data.discount_type
    };
  }
};