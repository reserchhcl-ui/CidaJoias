import api from '@/lib/api';
import { UserProfile } from '@/types/auth'; // Reutilizando tipo UserProfile

export const userService = {
  getAllUsers: async (): Promise<UserProfile[]> => {
    const response = await api.get<UserProfile[]>('/users/');
    return response.data;
  },
  
  // Se futuramente o backend permitir editar roles:
  // updateUserRole: async (id: number, role: string) => ...
};