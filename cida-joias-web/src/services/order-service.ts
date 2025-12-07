import api from '@/lib/api';
import { Order } from '@/types/dashboard'; // Reutilizando tipo Order

// Status possíveis do pedido
export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';

export const orderService = {
  // Admin: Listar todos os pedidos
  getAllOrders: async (): Promise<Order[]> => {
    const response = await api.get<Order[]>('/orders/');
    return response.data;
  },

  // Admin: Detalhes do pedido
  getOrderById: async (id: number): Promise<Order> => {
    const response = await api.get<Order>(`/orders/${id}`);
    return response.data;
  },

  // Admin: Atualizar Status
  updateStatus: async (id: number, status: OrderStatus): Promise<Order> => {
    // O endpoint é PATCH /orders/{id}/status?new_status=...
    const response = await api.patch<Order>(`/orders/${id}/status?new_status=${status}`);
    return response.data;
  }
};