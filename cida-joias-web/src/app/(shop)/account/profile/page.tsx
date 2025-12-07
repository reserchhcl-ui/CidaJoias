'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Save, Instagram } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

import { profileSchema, ProfileFormValues } from '@/types/auth';
import { authService } from '@/services/auth-service';
import { useAuthStore } from '@/store/use-auth-store';
import { formatPhone } from '@/lib/utils';

export default function ProfilePage() {
  const { user, setAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: '',
      email: '',
      phone_number: '',
      instagram_handle: '',
    },
  });

  // Preencher formulário com dados atuais
  useEffect(() => {
    if (user) {
      form.reset({
        full_name: user.full_name || '',
        email: user.email || '',
        phone_number: user.phone_number || '',
        instagram_handle: user.instagram_handle || '',
      });
    }
  }, [user, form]);

  async function onSubmit(data: ProfileFormValues) {
    setIsLoading(true);
    try {
      // --- CORREÇÃO AQUI ---
      // Criamos um payload explícito para garantir que 'role', 'id', etc. NÃO sejam enviados.
      // O backend bloqueia se receber o campo 'role', mesmo que o valor não tenha mudado.
      const payload = {
        full_name: data.full_name,
        email: data.email, // Envie apenas se sua API permitir troca de email neste endpoint
        phone_number: data.phone_number,
        instagram_handle: data.instagram_handle,
      };

      const updatedUser = await authService.updateProfile(payload);
      
      setAuth(updatedUser); 
      
      toast.success("Perfil atualizado com sucesso!");
    } catch (error: any) { // Tipagem 'any' para acessar error.response
      console.error(error);
      // Tratamento de erro melhorado
      const errorMsg = error.response?.data?.detail || "Erro ao atualizar perfil.";
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }

  if (!user) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Meus Dados</CardTitle>
        <CardDescription>Mantenha suas informações pessoais atualizadas.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Email geralmente é Read-only em muitos sistemas, 
                  mas se sua API permitir alterar, mantenha o Input normal.
                  Vou deixar como disabled por segurança padrão. */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} disabled className="bg-slate-100" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone / WhatsApp</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="(11) 99999-9999" 
                        {...field} 
                        onChange={(e) => field.onChange(formatPhone(e.target.value))}
                        maxLength={15}
                      />
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
                    <div className="relative">
                      <Instagram className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input className="pl-9" placeholder="@seu.perfil" {...field} />
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                Salvar Alterações
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}