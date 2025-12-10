import api from '@/lib/api';
import { ProductPublic, ProductAdmin, Category, InventoryStats,ProductSearchFilters } from '@/types/product';

const PUBLIC_URI = '/products';
const ADMIN_URI = '/backoffice/products';

export const productService = {
  // ==========================================
  // ÁREA PÚBLICA (LOJA) - Apenas Leitura
  // ==========================================

  // Busca produtos "sanitizados" (sem preço de custo, fornecedor, etc)
  getProductsPublic: async (page = 0, limit = 100): Promise<ProductPublic[]> => {
    // Nota: Adicione lógica de filtros aqui se necessário (?category_id=...)
    const response = await api.get<ProductPublic[]>(`${PUBLIC_URI}/?skip=${page * limit}&limit=${limit}`);
    return response.data;
  },

  getProductPublicById: async (id: number): Promise<ProductPublic> => {
    const response = await api.get<ProductPublic>(`${PUBLIC_URI}/${id}`);
    return response.data;
  },

  getCategories: async (): Promise<Category[]> => {
    const response = await api.get<Category[]>('/categories/');
    return response.data;
  },

  searchProductsPublic: async (filters: ProductSearchFilters): Promise<ProductPublic[]> => {
    const response = await api.post<ProductPublic[]>(`${PUBLIC_URI}/search`, filters);
    return response.data;
  },

  // ==========================================
  // ÁREA ADMIN (BACKOFFICE) - Acesso Total
  // ==========================================

  // Busca produtos completos (com custo, ref fornecedor, etc)
  getProductsAdmin: async (page = 0, limit = 100): Promise<ProductAdmin[]> => {
    const response = await api.get<ProductAdmin[]>(`${ADMIN_URI}/?skip=${page * limit}&limit=${limit}`);
    return response.data;
  },

  getProductAdminById: async (id: number): Promise<ProductAdmin> => {
    const response = await api.get<ProductAdmin>(`${ADMIN_URI}/${id}`);
    return response.data;
  },

  // CRUD Completo
  createProduct: async (data: any): Promise<ProductAdmin> => {
    const response = await api.post<ProductAdmin>(`${ADMIN_URI}/`, data);
    return response.data;
  },

  updateProduct: async (id: number, data: any): Promise<ProductAdmin> => {
    const response = await api.put<ProductAdmin>(`${ADMIN_URI}/${id}`, data);
    return response.data;
  },

  deleteProduct: async (id: number): Promise<void> => {
    await api.delete(`${ADMIN_URI}/${id}`);
  },

  // Funcionalidades Específicas do Admin
  generateBarcode: async (): Promise<string> => {
    const response = await api.get<{ barcode: string }>(`${ADMIN_URI}/generate-barcode`);
    return response.data.barcode;
  },

  getInventoryStats: async (): Promise<InventoryStats> => {
    const response = await api.get<InventoryStats>(`${ADMIN_URI}/stats/inventory`);
    return response.data;
  },

  searchProductsAdmin: async (term: string): Promise<ProductAdmin[]> => {
    // Montamos o filtro. Se quiser filtrar categoria também, adicione aqui.
    const filters = { search_term: term };
    
    // IMPORTANTE: Usar ADMIN_URI para receber cost_price e supplier_ref
    const response = await api.post<ProductAdmin[]>(`${ADMIN_URI}/search`, filters);
    return response.data;
  },

  // Categorias (Admin cria/deleta)
  createCategory: async (data: any): Promise<Category> => {
      const response = await api.post<Category>('/categories/', data);
      return response.data;
    },
  
  // ADICIONAR SE FALTAR
  updateCategory: async (id: number, data: any): Promise<Category> => {
    const response = await api.put<Category>(`/categories/${id}`, data);
    return response.data;
  },
  deleteCategory: async (id: number): Promise<void> => {
    await api.delete(`/categories/${id}`);
  },
};