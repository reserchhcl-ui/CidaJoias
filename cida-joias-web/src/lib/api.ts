import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import Cookies from 'js-cookie';
import { toast } from 'sonner'; // Importamos o Toast para feedback visual

export const TOKEN_KEY = 'cidajoias.token';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = Cookies.get(TOKEN_KEY);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response) {
      const { status } = error.response;
      
      switch (status) {
        case 401:
          // Token expirado/inválido
          Cookies.remove(TOKEN_KEY, { path: '/' });
          if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
             window.location.href = '/login';
             toast.error("Sessão expirada. Faça login novamente.");
          }
          break;
          
        case 403:
          // CORREÇÃO AQUI: Tratamento do Acesso Negado
          console.error('Acesso negado (Forbidden).');
          if (typeof window !== 'undefined') {
            toast.error("Acesso Negado", {
              description: "Você não tem permissão para acessar esta área."
            });
            // Redireciona para a Home (ou dashboard do cliente)
            window.location.href = '/'; 
          }
          break;
          
        case 404:
          console.error('Recurso não encontrado.');
          break;

        case 422:
          console.error('Erro de validação:', error.response.data);
          // Opcional: Mostrar erro genérico se for algo crítico
          break;
          
        default:
          console.error(`Erro inesperado (${status})`);
          toast.error("Ocorreu um erro inesperado. Tente novamente.");
      }
    } else {
      console.error('Erro de conexão');
      toast.error("Erro de conexão com o servidor.");
    }

    return Promise.reject(error);
  }
);

export default api;