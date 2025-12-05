import api, { TOKEN_KEY } from '@/lib/api';
import Cookies from 'js-cookie';
import { AuthResponse, LoginFormValues, RegisterFormValues, UserProfile } from '@/types/auth';

export const authService = {
  // Login: Posta Form Data (x-www-form-urlencoded)
  login: async (data: LoginFormValues): Promise<AuthResponse> => {
    const formData = new URLSearchParams();
    formData.append('username', data.email); // O backend espera 'username', mesmo sendo email
    formData.append('password', data.password);

    const response = await api.post<AuthResponse>('/token', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    // Salva o token no cookie
    if (response.data.access_token) {
      Cookies.set(TOKEN_KEY, response.data.access_token, { expires: 1 }); // 1 dia
    }

    return response.data;
  },

  // Registro: JSON padrão
  register: async (data: Omit<RegisterFormValues, 'confirmPassword'>) => {
    return await api.post('/users/register', data);
  },

  // Buscar Perfil do Usuário Logado
  getProfile: async (): Promise<UserProfile> => {
    const response = await api.get<UserProfile>('/users/me');
    return response.data;
  },

  logout: () => {
    // 1. Remove o cookie forçando o path '/'
    Cookies.remove(TOKEN_KEY, { path: '/' });
    
    // 2. Opcional: Recarrega a página para garantir limpeza de estados em memória do React
    //window.location.href = '/login'; 
  },
};