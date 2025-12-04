import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import Cookies from 'js-cookie';

// Definição de chave para armazenamento do token
export const TOKEN_KEY = 'cidajoias.token';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Timeout razoável para evitar travamentos
  timeout: 10000,
});

// --- Request Interceptor ---
// Injeta o token em todas as requisições, se existir
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = Cookies.get(TOKEN_KEY);
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// --- Response Interceptor ---
// Centraliza o tratamento de erros HTTP
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    
    if (error.response) {
      const { status, data } = error.response;
      
      // Tratamento específico por Status Code
      switch (status) {
        case 401:
          // Token expirado ou inválido
          console.warn('Sessão expirada. Redirecionando para login...');
          Cookies.remove(TOKEN_KEY);
          // O redirecionamento idealmente deve ser feito via componente ou router,
          // mas aqui garantimos a limpeza.
          if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
             window.location.href = '/login';
          }
          break;
          
        case 403:
          console.error('Acesso negado (Forbidden).');
          // Aqui você pode disparar um Toast de erro "Sem permissão"
          break;
          
        case 404:
          console.error('Recurso não encontrado.');
          break;

        case 422:
          // Erros de validação do Pydantic (Backend)
          console.error('Erro de validação:', data);
          break;
          
        default:
          console.error(`Erro inesperado (${status}):`, data);
      }
    } else {
      console.error('Erro de conexão ou Network Error');
    }

    return Promise.reject(error);
  }
);

export default api;