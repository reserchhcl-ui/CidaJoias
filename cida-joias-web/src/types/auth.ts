export type UserRole = 'customer' | 'sales_rep' | 'admin';

export interface User {
  id: number;
  email: string;
  is_active: boolean;
  role: UserRole;
  full_name?: string; // Se houver no backend
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  // O backend pode retornar dados do usuário aqui ou não.
  // Se não, precisaremos buscar o perfil `/users/me` logo após o login.
}

import { z } from 'zod';

// --- Schemas Zod (Validação do Formulário) ---
export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha obrigatória'),
});

export const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
  confirmPassword: z.string().min(1, 'Confirmação obrigatória'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não conferem",
  path: ["confirmPassword"],
});

// --- Tipos TypeScript ---
export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface UserProfile {
  id: number;
  email: string;
  is_active: boolean;
  role: 'customer' | 'sales_rep' | 'admin';
  full_name?: string;
}