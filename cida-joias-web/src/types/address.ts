import { z } from 'zod';

// Interface (Como vem do Banco/API)
export interface Address {
  id: number;
  name: string;
  recipient_name: string;
  zip_code: string;
  street: string;
  number: string;
  complement?: string | null; // Pode vir null do banco
  neighborhood: string;
  city: string;
  state: string;
  is_default: boolean;
}

// Schema (Validação do Formulário)
export const addressSchema = z.object({
  name: z.string().min(1, 'Dê um nome para o local'),
  recipient_name: z.string().min(3, 'Nome obrigatório'),
  zip_code: z.string().min(8, 'CEP inválido').max(9),
  street: z.string().min(3, 'Rua obrigatória'),
  number: z.string().min(1, 'Número obrigatório'),
  
  // AQUI É A CHAVE: 
  // .nullable() aceita null na entrada.
  // .transform() garante que se vier null, vira "" na saída.
  complement: z.string().nullable().optional().transform(val => val ?? ''),
  
  neighborhood: z.string().min(1, 'Bairro obrigatório'),
  city: z.string().min(1, 'Cidade obrigatória'),
  state: z.string().length(2, 'UF inválida'),
  
  // O boolean padrão false resolve o problema do checkbox
  is_default: z.boolean().default(false),
});

export type AddressFormValues = z.infer<typeof addressSchema>;