// src/services/sales-case-service.ts
import api from '@/lib/api';
import { SalesCase, CreateCaseDTO } from '@/types/sales-case';

const ADMIN_URI = '/backoffice/sales-cases';
const REP_URI = '/sales-cases';

export const salesCaseService = {
  // --- ÁREA DO ADMIN (BACKOFFICE) ---

  getAllCasesAdmin: async (status?: string): Promise<SalesCase[]> => {
    const params = status ? { status } : {};
    const response = await api.get<SalesCase[]>(ADMIN_URI, { params });
    return response.data;
  },

  getCaseAdminById: async (id: number): Promise<SalesCase> => {
    const response = await api.get<SalesCase>(`${ADMIN_URI}/${id}`);
    return response.data;
  },

  createCase: async (data: CreateCaseDTO): Promise<SalesCase> => {
    const response = await api.post<SalesCase>(ADMIN_URI, data);
    return response.data;
  },

  deleteCase: async (id: number): Promise<void> => {
    await api.delete(`${ADMIN_URI}/${id}`);
  },

  addItem: async (caseId: number, productId: number, quantity: number) => {
    const response = await api.post(`${ADMIN_URI}/${caseId}/items`, {
      product_id: productId,
      quantity
    });
    return response.data;
  },

  updateItemQuantity: async (caseId: number, productId: number, quantity: number) => {
    const response = await api.put(`${ADMIN_URI}/${caseId}/items/${productId}`, {
      quantity
    });
    return response.data;
  },

  // --- ÁREA DA VENDEDORA (APP) ---

  getMyCases: async (): Promise<SalesCase[]> => {
    const response = await api.get<SalesCase[]>(`${REP_URI}/meus-estojos`);
    return response.data;
  },

  getCaseDetails: async (id: number): Promise<SalesCase> => {
    const response = await api.get<SalesCase>(`${REP_URI}/${id}`);
    return response.data;
  },

  // Lógica de Download (BLOB)
  downloadMarketingPack: async (caseId: number, caseCode: string) => {
    try {
        const response = await api.get(`${REP_URI}/${caseId}/marketing-pack`, {
            responseType: 'blob', // Crucial para arquivos binários
        });

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Midia_${caseCode}.zip`); // Nome do arquivo
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url); // Limpa memória
        return true;
    } catch (error) {
        console.error("Erro no download", error);
        throw error;
    }
  },

  returnCase: async (id: number, itemsReturned: {product_id: number, quantity: number}[]) => {
    const response = await api.post(`${REP_URI}/${id}/return`, { items_returned: itemsReturned });
    return response.data;
  }
};