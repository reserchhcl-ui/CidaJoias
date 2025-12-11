// src/services/order-service.ts
import api from '@/lib/api';
import { Order, OrderFilter, OrderStatus } from '@/types/order';

const PUBLIC_URI = '/orders';
const BACKOFFICE_URI = '/backoffice/orders';

export const orderService = {
  // --- ÁREA DO CLIENTE (LOJA) ---

  // Listar meus pedidos
  getMyOrders: async (): Promise<Order[]> => {
    const response = await api.get<Order[]>(`${PUBLIC_URI}/meus-pedidos`);
    return response.data;
  },

  // Detalhes do pedido (Cliente)
  getOrderById: async (id: number): Promise<Order> => {
    const response = await api.get<Order>(`${PUBLIC_URI}/${id}`);
    return response.data;
  },

  // --- ÁREA DO ADMIN (BACKOFFICE) ---

  // Busca Avançada (Filtros)
  searchOrdersAdmin: async (filters: OrderFilter): Promise<Order[]> => {
    const response = await api.post<Order[]>(`${BACKOFFICE_URI}/search`, filters);
    return response.data;
  },

  // Pegar detalhes (Admin - pode ver mais dados internos se houver)
  getOrderAdminById: async (id: number): Promise<Order> => {
    const response = await api.get<Order>(`${BACKOFFICE_URI}/${id}`);
    return response.data;
  },

  // Atualizar Status
  updateOrderStatus: async (id: number, status: OrderStatus): Promise<Order> => {
    const response = await api.put<Order>(`${BACKOFFICE_URI}/${id}`, { status });
    return response.data;
  },
};