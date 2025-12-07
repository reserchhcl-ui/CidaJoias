import { z } from 'zod';

// --- LOGIN ---
export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha obrigatória'),
});

// --- REGISTRO & PERFIL (Novos Campos) ---
export const registerSchema = z.object({
  full_name: z.string().min(3, 'Nome completo é obrigatório'),
  email: z.string().email('Email inválido'),
  phone_number: z.string().min(14, 'Telefone inválido'), // (11) 99999-9999 tem 15 chars
  instagram_handle: z.string().optional(), // Opcional, mas bom ter campo
  password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
  confirmPassword: z.string().min(1, 'Confirmação obrigatória'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não conferem",
  path: ["confirmPassword"],
});

// Schema para Edição de Perfil (Sem senha)
export const profileSchema = z.object({
  full_name: z.string().min(3, 'Nome completo é obrigatório'),
  email: z.string().email('Email inválido'),
  phone_number: z.string().min(14, 'Telefone inválido'),
  instagram_handle: z.string().optional(),
});

// --- Tipos TypeScript ---
export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
export type ProfileFormValues = z.infer<typeof profileSchema>;

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface UserProfile {
  id: number;
  email: string;
  full_name: string;      // Novo
  phone_number?: string;  // Novo
  instagram_handle?: string; // Novo
  is_active: boolean;
  role: 'customer' | 'sales_rep' | 'admin';
}