import api, { TOKEN_KEY } from '@/lib/api';
import Cookies from 'js-cookie';
import { 
  AuthResponse, 
  LoginFormValues, 
  RegisterFormValues, 
  UserProfile, 
  ProfileFormValues 
} from '@/types/auth';

export const authService = {
  // Login (Sem alterações)
  login: async (data: LoginFormValues): Promise<AuthResponse> => {
    const formData = new URLSearchParams();
    formData.append('username', data.email);
    formData.append('password', data.password);

    const response = await api.post<AuthResponse>('/token', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    if (response.data.access_token) {
      Cookies.set(TOKEN_KEY, response.data.access_token, { expires: 1, path: '/' });
    }
    return response.data;
  },

  // Registro (Atualizado com novos campos)
  register: async (data: Omit<RegisterFormValues, 'confirmPassword'>) => {
    // O backend espera { email, password, full_name, phone_number, ... }
    return await api.post('/users/register', data);
  },

  // Buscar Perfil
  getProfile: async (): Promise<UserProfile> => {
    const response = await api.get<UserProfile>('/users/me');
    return response.data;
  },

  // ATUALIZAÇÃO DE PERFIL (Novo)
  updateProfile: async (data: ProfileFormValues): Promise<UserProfile> => {
    const response = await api.put<UserProfile>('/users/me', data);
    return response.data;
  },

  logout: () => {
    Cookies.remove(TOKEN_KEY, { path: '/' });
  },
};