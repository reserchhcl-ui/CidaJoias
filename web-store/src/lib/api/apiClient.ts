import axios from 'axios';
import { 
  ProductFilter, 
  Address, 
  ShippingOption, 
  CouponValidationResponse, 
  Category, 
  Product, 
  PaymentPayload,
  User
} from '@/src/lib/types';


// Configuração da instância do Axios
const api = axios.create({
  // URL base do Backend FastAPI. 
  // Tenta pegar do .env (NEXT_PUBLIC_API_URL), senão usa o padrão local.
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar o Token JWT automaticamente em todas as requisições
api.interceptors.request.use((config) => {
  // Verifica se estamos no browser para acessar o localStorage
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

/**
 * Helper para construir URLs de imagens corretamente.
 * Trata URLs absolutas (http) e relativas (/static/...).
 */
export const getImageUrl = (path: string | null) => {
  if (!path) return "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&q=80"; // Fallback placeholder
  if (path.startsWith('http')) return path;
  
  // Remove barra inicial se houver e constrói URL completa baseada na API
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${api.defaults.baseURL}/static/${cleanPath}`;
};

// --- Serviços de Administração (Vendedoras) ---
export const AdminService = {
  // Lista Vendedoras (Sales Reps)
  getSalesReps: async () => {
    try {
      // Idealmente: GET /users?role=sales_rep
      const { data } = await api.get<User[]>('/users/?role=sales_rep');
      return data;
    } catch (e) {
      console.warn("Backend sem rota de listagem. Usando Mock para Admin.");
      // Mock para desenvolvimento da interface
      return [
        { id: 101, email: "ana.vendas@cidajoias.com", role: "sales_rep" },
        { id: 102, email: "carlos.rep@cidajoias.com", role: "sales_rep" },
      ] as User[];
    }
  },

  // Cria uma nova Vendedora
  createSalesRep: async (userData: any) => {
    // Usa o endpoint de registro existente, mas forçando a role
    const payload = { ...userData, role: "sales_rep" };
    const { data } = await api.post('/users/register', payload);
    return data;
  },

  // Remove usuário (Necessita implementação no Backend)
  deleteUser: async (id: number) => {
    // Idealmente: DELETE /users/{id}
    const { data } = await api.delete(`/users/${id}`);
    return data;
  }
};

// --- Serviços de Produtos ---
export const ProductService = {
  // Busca avançada usando o Specification Pattern
  search: async (filter: ProductFilter) => {
    const { data } = await api.post<Product[]>('/products/search', filter);
    return data;
  },
  
  // Lista todas as categorias para o menu
  getCategories: async () => {
    const { data } = await api.get<Category[]>('/categories/');
    return data;
  },

  // Busca detalhes de um produto específico
  getById: async (id: number) => {
    const { data } = await api.get<Product>(`/products/${id}`);
    return data;
  }
};

// --- Serviços de Checkout e Usuário ---
export const CheckoutService = {
  // Busca endereços do usuário logado
  getAddresses: async () => {
    try {
      const { data } = await api.get<Address[]>('/addresses/');
      return data;
    } catch (e) {
      console.warn("API de endereços indisponível ou falha de auth, usando mock para desenvolvimento.");
      // Fallback Mock para não travar o desenvolvimento do front enquanto o backend ajusta
      return [
        { id: 1, name: "Casa", recipient_name: "Usuário Teste", zip_code: "01001-000", street: "Rua das Flores", number: "123", city: "São Paulo", state: "SP", is_default: true },
        { id: 2, name: "Trabalho", recipient_name: "Usuário Teste", zip_code: "20040-000", street: "Av. Rio Branco", number: "500", city: "Rio de Janeiro", state: "RJ", is_default: false }
      ];
    }
  },

  // Simulação de Frete (Envia CEP + Itens do carrinho)
  simulateShipping: async (zipCode: string, items: {product_id: number, quantity: number}[]) => {
    const { data } = await api.post<ShippingOption[]>('/shipping/simulate', { 
      zip_code: zipCode, 
      items 
    });
    return data;
  },

  // Validação de Cupom de Desconto
  validateCoupon: async (code: string, cartTotal: number) => {
    // Passa o valor atual do carrinho como query param para validação de regras de negócio
    const { data } = await api.get<CouponValidationResponse>(`/coupons/validate/${code}?value=${cartTotal}`);
    return data;
  },

  // Processamento de Pagamento
  processPayment: async (paymentData: PaymentPayload) => {
    const { data } = await api.post('/payments/process', paymentData);
    return data;
  }
};

export default api;