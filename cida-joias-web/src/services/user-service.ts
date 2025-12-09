import api from '@/lib/api';
import { UserProfile } from '@/types/auth';
import { Order } from '@/types/dashboard'; // Certifique-se que Order existe aqui

// Interface para atualização administrativa
export interface AdminUpdateUserDTO {
  full_name?: string;
  email?: string;
  phone_number?: string;
  instagram_handle?: string;
  role?: 'customer' | 'sales_rep' | 'admin';
  is_active?: boolean;
}

export const userService = {
  // Listar todos
  getAllUsers: async (): Promise<UserProfile[]> => {
    const response = await api.get<UserProfile[]>('/users/');
    return response.data;
  },

  // Buscar um (Detalhes)
  getUserById: async (id: number): Promise<UserProfile> => {
    const response = await api.get<UserProfile>(`/users/${id}`);
    return response.data;
  },


  // Atualizar (Admin)
  updateUser: async (id: number, data: AdminUpdateUserDTO): Promise<UserProfile> => {
    const response = await api.put<UserProfile>(`/users/${id}`, data);
    return response.data;
  },

  // Deletar
  deleteUser: async (id: number): Promise<void> => {
    await api.delete(`/users/${id}`);
  },

  // Buscar Pedidos do Usuário
  getUserOrders: async (id: number): Promise<Order[]> => {
    const response = await api.get<Order[]>(`/users/${id}/orders`);
    return response.data;
  }
};