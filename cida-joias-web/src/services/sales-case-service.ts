import api from '@/lib/api';
import { SalesCase } from '@/types/dashboard';

export interface SalesCaseItemCreate {
  product_id: number;
  quantity: number;
}

export interface CreateSalesCaseDTO {
  sales_rep_id: number;
  loan_duration_days: number;
  items: SalesCaseItemCreate[];
}

export interface AddCaseItemDTO {
  product_id?: number | null;
  barcode?: string;
  quantity: number;
}

export interface UpdateCaseItemDTO {
  quantity: number;
}

export const salesCaseService = {
  // Listar todos
  getAllCases: async (): Promise<SalesCase[]> => {
    const response = await api.get<SalesCase[]>('/sales-cases/');
    return response.data;
  },

  // Buscar por ID (Detalhes/Edição)
  getCaseById: async (id: number): Promise<SalesCase> => {
    const response = await api.get<SalesCase>(`/sales-cases/${id}`);
    return response.data;
  },

  // Criar
  createCase: async (data: CreateSalesCaseDTO): Promise<SalesCase> => {
    const response = await api.post<SalesCase>('/sales-cases/', data);
    return response.data;
  },

  // Atualizar (PUT)
  // Nota: O backend precisa suportar PUT /sales-cases/{id} com o mesmo payload de criação
  updateCase: async (id: number, data: CreateSalesCaseDTO): Promise<SalesCase> => {
    const response = await api.put<SalesCase>(`/sales-cases/${id}`, data);
    return response.data;
  },
  addItem: async (caseId: number, data: AddCaseItemDTO): Promise<SalesCase> => {
    const response = await api.post<SalesCase>(`/sales-cases/${caseId}/items`, data);
    return response.data;
  },

  // 2. ATUALIZAR/REMOVER ITEM
  updateItemQuantity: async (caseId: number, productId: number, quantity: number): Promise<SalesCase> => {
    const response = await api.put<SalesCase>(`/sales-cases/${caseId}/items/${productId}`, { quantity });
    return response.data;
  },
  
  deleteCase: async (id: number): Promise<void> => {
    await api.delete(`/sales-cases/${id}`);
  },
};