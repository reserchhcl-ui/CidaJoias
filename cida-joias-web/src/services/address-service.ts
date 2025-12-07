import api from '@/lib/api';
import { Address, AddressFormValues } from '@/types/address';
import axios from 'axios';

export const addressService = {
  // Listar Endereços
  getMyAddresses: async (): Promise<Address[]> => {
    const response = await api.get<Address[]>('/addresses/');
    return response.data;
  },

  // Criar
  createAddress: async (data: AddressFormValues): Promise<Address> => {
    // Backend espera zip_code limpo (apenas números)
    const payload = {
        ...data,
        zip_code: data.zip_code.replace(/\D/g, '')
    };
    const response = await api.post<Address>('/addresses/', payload);
    return response.data;
  },

  // Atualizar
  updateAddress: async (id: number, data: AddressFormValues): Promise<Address> => {
    const payload = {
        ...data,
        zip_code: data.zip_code.replace(/\D/g, '')
    };
    const response = await api.put<Address>(`/addresses/${id}`, payload);
    return response.data;
  },

  // Deletar
  deleteAddress: async (id: number): Promise<void> => {
    await api.delete(`/addresses/${id}`);
  },

  // --- Helper Externo: Busca CEP (ViaCEP) ---
  fetchByCep: async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) return null;
    
    // Chamada direta ao ViaCEP (sem passar pelo nosso backend para ser mais rápido na UI)
    const response = await axios.get(`https://viacep.com.br/ws/${cleanCep}/json/`);
    if (response.data.erro) throw new Error("CEP não encontrado");
    
    return {
      street: response.data.logradouro,
      neighborhood: response.data.bairro,
      city: response.data.localidade,
      state: response.data.uf,
    };
  }
};