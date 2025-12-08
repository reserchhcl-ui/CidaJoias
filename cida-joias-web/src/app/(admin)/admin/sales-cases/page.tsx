'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form'; // Importar useWatch
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Loader2, ArrowRight, User, Calendar, Phone } from 'lucide-react'; // Importar Phone
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

import { salesCaseService } from '@/services/sales-case-service';
import { userService } from '@/services/user-service';

const createCaseSchema = z.object({
  sales_rep_id: z.string().min(1, "Selecione uma vendedora"), 
  loan_duration_days: z.coerce.number().min(1, "Mínimo 1 dia"),
});

type CreateCaseFormValues = z.infer<typeof createCaseSchema>;

export default function NewSalesCasePage() {
  const router = useRouter();
  
  // Buscar Vendedoras
  const { data: users } = useQuery({
    queryKey: ['admin-users'],
    queryFn: userService.getAllUsers,
  });
  
  const salesReps = users?.filter(u => u.role === 'sales_rep');

  const form = useForm({
    resolver: zodResolver(createCaseSchema),
    defaultValues: {
      sales_rep_id: '',
      loan_duration_days: 30,
    },
  });

  // Observa o ID selecionado para exibir detalhes extras (telefone)
  const selectedRepId = useWatch({ control: form.control, name: 'sales_rep_id' });
  const selectedRep = salesReps?.find(u => u.id.toString() === selectedRepId);

  const createMutation = useMutation({
    mutationFn: (data: CreateCaseFormValues) => salesCaseService.createCase({
        sales_rep_id: Number(data.sales_rep_id),
        loan_duration_days: data.loan_duration_days,
        items: [] 
    }),
    onSuccess: (newCase) => {
      toast.success("Estojo iniciado!", {
        description: "Agora adicione os produtos."
      });
      router.push(`/admin/sales-cases/${newCase.id}`);
    },
    onError: (error: any) => {
        const msg = error.response?.data?.detail || "Erro ao criar estojo.";
        toast.error(msg);
    },
  });

  const onSubmit = (data: any) => {
    createMutation.mutate(data as CreateCaseFormValues);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Novo Estojo</h1>
        <p className="text-muted-foreground">Passo 1: Defina a vendedora para iniciar a montagem.</p>
      </div>

      <Card className="w-full shadow-lg border-t-4 border-t-primary">
        <CardHeader>
            <CardTitle>Dados Iniciais</CardTitle>
            <CardDescription>Os produtos serão adicionados na próxima etapa.</CardDescription>
        </CardHeader>
        <CardContent>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    
                    <div className="grid md:grid-cols-2 gap-6">
                        <FormField
                            control={form.control}
                            name="sales_rep_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-2">
                                        <User className="h-4 w-4" /> Vendedora
                                    </FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value as string}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione..." />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {salesReps?.map(u => (
                                                <SelectItem key={u.id} value={u.id.toString()}>
                                                    {u.full_name || u.email} 
                                                    {/* Mostra o telefone no dropdown se existir */}
                                                    {u.phone_number ? ` - ${u.phone_number}` : ''}
                                                </SelectItem>
                                            ))}
                                            {salesReps?.length === 0 && <SelectItem value="0" disabled>Nenhuma vendedora encontrada</SelectItem>}
                                        </SelectContent>
                                    </Select>
                                    
                                    {/* Exibe o telefone selecionado abaixo do campo para confirmação visual */}
                                    {selectedRep && (
                                        <div className="text-xs text-blue-600 flex items-center gap-1 mt-1 bg-blue-50 p-2 rounded">
                                            <Phone className="h-3 w-3" />
                                            Contato: {selectedRep.phone_number || "Não cadastrado"}
                                        </div>
                                    )}
                                    
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="loan_duration_days"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4" /> Duração (Dias)
                                    </FormLabel>
                                    <FormControl>
                                        <Input type="number" {...field} value={field.value as number} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <div className="flex justify-end gap-4 pt-4 border-t">
                        <Button type="button" variant="ghost" onClick={() => router.back()}>
                            Cancelar
                        </Button>
                        <Button type="submit" size="lg" disabled={createMutation.isPending} className="gap-2">
                            {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                            {createMutation.isPending ? "Criando..." : "Continuar para Itens"}
                        </Button>
                    </div>
                </form>
            </Form>
        </CardContent>
      </Card>
    </div>
  );
}