import api from '@/lib/api';
import { Order, SalesCase } from '@/types/dashboard';

export const dashboardService = {
  // CLIENTE: Meus Pedidos
  getMyOrders: async (): Promise<Order[]> => {
    const response = await api.get<Order[]>('/orders/meus-pedidos');
    return response.data;
  },

  // VENDEDORA: Meus Estojos
  getMySalesCases: async (): Promise<SalesCase[]> => {
    const response = await api.get<SalesCase[]>('/sales-cases/');
    return response.data;
  }
};