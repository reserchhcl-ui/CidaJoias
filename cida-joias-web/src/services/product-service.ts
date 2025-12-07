import api from '@/lib/api';
import { Category, Product, ProductSearchFilters } from '@/types/product';
export interface UpdateProductDTO extends Partial<CreateProductDTO> {}
export interface CreateProductDTO {
  name: string;
  description?: string;
  selling_price: number;
  cost_price: number;
  stock_quantity: number;
  category_id: number;
  image_url?: string;
}

export interface CategoryCreateDTO {
  name: string;
  slug: string;
}
export const productService = {
  // Listar Categorias
  getCategories: async (): Promise<Category[]> => {
    const response = await api.get<Category[]>('/categories/');
    return response.data;
  },

  // Listagem Simples (Paginada)
  getProducts: async (skip = 0, limit = 20): Promise<Product[]> => {
    const response = await api.get<Product[]>(`/products/?skip=${skip}&limit=${limit}`);
    return response.data;
  },

  
  // Busca Avançada (Filtros)
  searchProducts: async (filters: ProductSearchFilters): Promise<Product[]> => {
    const response = await api.post<Product[]>('/products/search', filters);
    return response.data;
  },
  
  // Detalhe do Produto
  getProductById: async (id: number): Promise<Product> => {
    const response = await api.get<Product>(`/products/${id}`);
    return response.data;
  },
  // --- MÉTODOS DE ADMIN ---
  
  createProduct: async (data: CreateProductDTO): Promise<Product> => {
    // O backend espera Decimal, mas aceita number no JSON
    const response = await api.post<Product>('/products/', data);
    return response.data;
  },
  updateProduct: async (id: number, data: UpdateProductDTO): Promise<Product> => {
    const response = await api.put<Product>(`/products/${id}`, data);
    return response.data;
  },
  
  deleteProduct: async (id: number): Promise<void> => {
    await api.delete(`/products/${id}`);
  },

  uploadImage: async (productId: number, file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append('file', file); // 'file' deve corresponder ao nome do parâmetro no FastAPI

    const response = await api.post<{ url: string }>(`/products/${productId}/image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  createCategory: async (data: CategoryCreateDTO): Promise<Category> => {
    const response = await api.post<Category>('/categories/', data);
    return response.data;
  },

  deleteCategory: async (id: number): Promise<void> => {
    await api.delete(`/categories/${id}`);
  },
  
  // Backoffice Dashboard Stats (Se houver endpoint, senão simulamos ou buscamos listas)
  getDashboardStats: async () => {
    // Exemplo: se não tiver endpoint de stats, fazemos várias chamadas
    const [products, orders, salesCases] = await Promise.all([
        api.get('/products/?limit=9999'),
        api.get('/orders/meus-pedidos'), // Ajustar para endpoint de admin se houver
        api.get('/sales-cases/')
    ]);
    return {
        productsCount: products.headers['x-total-count'] || 0, // Se o back enviar total no header
        ordersCount: orders.data.length,
        activeCases: salesCases.data.length
    };
  }
};