'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Save, Instagram, Phone } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

import { UserProfile } from '@/types/auth';
import { formatPhone } from '@/lib/utils'; // Importar a máscara

const userAdminSchema = z.object({
  full_name: z.string().min(3, "Nome obrigatório"),
  email: z.string().email("Email inválido"),
  role: z.enum(['customer', 'sales_rep', 'admin']),
  is_active: z.boolean(), // Deve ser boolean
  phone_number: z.string().optional(),
  instagram_handle: z.string().optional(),
});

type UserAdminFormValues = z.infer<typeof userAdminSchema>;

interface UserFormProps {
  initialData: UserProfile;
  onSubmit: (data: UserAdminFormValues) => void;
  isSubmitting: boolean;
  onCancel: () => void;
}

export function UserForm({ initialData, onSubmit, isSubmitting, onCancel }: UserFormProps) {
  const form = useForm<UserAdminFormValues>({
    resolver: zodResolver(userAdminSchema),
    defaultValues: {
      full_name: initialData.full_name || '',
      email: initialData.email || '',
      role: initialData.role,
      is_active: initialData.is_active,
      phone_number: initialData.phone_number || '',
      instagram_handle: initialData.instagram_handle || '',
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        
        <FormField
          control={form.control}
          name="full_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome Completo</FormLabel>
              <FormControl><Input {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl><Input {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* --- NOVOS CAMPOS ADICIONADOS --- */}
        <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="phone_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone / WhatsApp</FormLabel>
                  <FormControl>
                    <div className="relative">
                        <Phone className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                            {...field} 
                            className="pl-9" 
                            placeholder="(00) 00000-0000"
                            onChange={(e) => field.onChange(formatPhone(e.target.value))}
                            maxLength={15}
                        />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="instagram_handle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Instagram</FormLabel>
                  <FormControl>
                    <div className="relative">
                        <Instagram className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input {...field} className="pl-9" placeholder="@usuario" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
        </div>

        <div className="grid grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Função (Role)</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                    <SelectItem value="customer">Cliente</SelectItem>
                    <SelectItem value="sales_rep">Vendedora</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
            />

            <FormField
            control={form.control}
            name="is_active"
            render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 mt-8">
                <FormControl>
                    <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    />
                </FormControl>
                <div className="space-y-1 leading-none">
                    <FormLabel>Ativo</FormLabel>
                    <FormDescription>
                        Acesso liberado.
                    </FormDescription>
                </div>
                </FormItem>
            )}
            />
        </div>

        <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" /> Salvar
            </Button>
        </div>
      </form>
    </Form>
  );
}