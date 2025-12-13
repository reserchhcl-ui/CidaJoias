// src/services/payment-service.ts
import api from '@/lib/api';
import { Order } from '@/types/order';


export interface PaymentDTO {
  order_id: number;
  payment_method: 'credit_card' | 'pix';
  card_data?: {
    holder_name: string;
    number: string;
    expiry_month: string;
    expiry_year: string;
    cvv: string;
  };
}

export interface PixResponse {
  qr_code: string;       // String Copia e Cola
  qr_code_url?: string;  // URL da imagem (opcional, se o back mandar)
  expires_at: string;
}

export const paymentService = {
    // Rota para Cartão de Crédito (Geralmente /process ou /credit-card)
    processCreditCard: async (data: PaymentDTO): Promise<{ order: Order }> => {
      // Mantendo a rota padrão para cartão
      const response = await api.post(`/payments/process`, data);
      return response.data;
    },
  
    // --- CORREÇÃO: Rota Específica de PIX ---
    generatePix: async (orderId: number): Promise<{ pix: PixResponse }> => {
      // Chamando a rota específica que você mencionou
      const response = await api.post(`/payments/pix`, { order_id: orderId });
      return response.data;
    },
  
    // Consultar status (Polling)
    checkPaymentStatus: async (orderId: number): Promise<{ status: string }> => {
      const response = await api.get<{ status: string }>(`/orders/${orderId}/status`);
      return response.data;
    }
  };

