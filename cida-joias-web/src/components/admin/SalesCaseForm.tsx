'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Save, Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

import { SalesCase } from '@/types/dashboard';
import { UserProfile } from '@/types/auth'; // Ou onde estiver definido User
import { ProductPublic,ProductAdmin } from '@/types/product';
import { differenceInDays } from 'date-fns';

// Schema Validation
const salesCaseSchema = z.object({
  sales_rep_id: z.string().min(1, "Selecione uma vendedora"), 
  loan_duration_days: z.coerce.number().min(1, "Mínimo 1 dia"),
  items: z.array(z.object({
    product_id: z.string().min(1, "Selecione um produto"),
    quantity: z.coerce.number().min(1, "Mínimo 1"),
  })).min(1, "Adicione pelo menos um produto"),
});

// Tipos Props
interface SalesCaseFormProps {
  initialData?: SalesCase;
  users?: UserProfile[];
  products?: ProductAdmin[];
  hideItems?: boolean;
  onSubmit: (data: any) => void;
  isSubmitting: boolean;
  onCancel: () => void;
}

export function SalesCaseForm({ initialData, users, products, onSubmit, isSubmitting, onCancel,hideItems = true }: SalesCaseFormProps) {
  const salesReps = users?.filter(u => u.role === 'sales_rep');

  // Calcular dias de duração se for edição
  const defaultDuration = initialData 
    ? differenceInDays(new Date(initialData.return_by_date), new Date(initialData.loan_date))
    : 30;

  const form = useForm({
    resolver: zodResolver(salesCaseSchema),
    defaultValues: {
      sales_rep_id: initialData?.sales_rep_id.toString() || '',
      loan_duration_days: defaultDuration > 0 ? defaultDuration : 30,
      items: initialData?.items.map(i => ({ 
        product_id: i.product_id.toString(), 
        quantity: i.quantity 
      })) || [{ product_id: '', quantity: 1 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  // Atualizar form se initialData mudar (ex: carregamento assíncrono)
  useEffect(() => {
    if (initialData) {
        const duration = differenceInDays(new Date(initialData.return_by_date), new Date(initialData.loan_date));
        form.reset({
            sales_rep_id: initialData.sales_rep_id.toString(),
            loan_duration_days: duration,
            items: initialData.items.map(i => ({ 
                product_id: i.product_id.toString(), 
                quantity: i.quantity 
            })),
        });
    }
  }, [initialData, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          
          {/* Dados Gerais */}
          {!hideItems && (
          <Card>
              <CardHeader><CardTitle>Informações do Estojo</CardTitle></CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-4">
                  <FormField
                      control={form.control}
                      name="sales_rep_id"
                      render={({ field }) => (
                          <FormItem>
                              <FormLabel>Vendedora</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value as string}>
                                  <FormControl>
                                      <SelectTrigger>
                                          <SelectValue placeholder="Selecione..." />
                                      </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                      {salesReps?.map(u => (
                                          <SelectItem key={u.id} value={u.id.toString()}>
                                              {u.full_name || u.email} (ID: {u.id})
                                          </SelectItem>
                                      ))}
                                  </SelectContent>
                              </Select>
                              <FormMessage />
                          </FormItem>
                      )}
                  />
                  <FormField
                      control={form.control}
                      name="loan_duration_days"
                      render={({ field }) => (
                          <FormItem>
                              <FormLabel>Duração (Dias)</FormLabel>
                              <FormControl>
                                  <Input type="number" {...field} value={field.value as number} />
                              </FormControl>
                              <FormMessage />
                          </FormItem>
                      )}
                  />
              </CardContent>
          </Card>
          )}

          {/* Itens */}
          <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Itens ({fields.length})</CardTitle>
                  <Button type="button" variant="outline" size="sm" onClick={() => append({ product_id: '', quantity: 1 })}>
                      <Plus className="mr-2 h-4 w-4" /> Adicionar Produto
                  </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                  {fields.map((field, index) => (
                      <div key={field.id} className="flex gap-4 items-end border-b pb-4 last:border-0 last:pb-0">
                          <FormField
                              control={form.control}
                              name={`items.${index}.product_id`}
                              render={({ field }) => (
                                  <FormItem className="flex-1">
                                      <FormLabel className={index !== 0 ? "sr-only" : ""}>Produto</FormLabel>
                                      <Select onValueChange={field.onChange} value={field.value as string}>
                                          <FormControl>
                                              <SelectTrigger>
                                                  <SelectValue placeholder="Selecione um produto..." />
                                              </SelectTrigger>
                                          </FormControl>
                                          <SelectContent>
                                              {products?.map(p => (
                                                  <SelectItem key={p.id} value={p.id.toString()}>
                                                      {p.name} (Estoque: {p.stock_quantity})
                                                  </SelectItem>
                                              ))}
                                          </SelectContent>
                                      </Select>
                                      <FormMessage />
                                  </FormItem>
                              )}
                          />
                          <FormField
                              control={form.control}
                              name={`items.${index}.quantity`}
                              render={({ field }) => (
                                  <FormItem className="w-24">
                                      <FormLabel className={index !== 0 ? "sr-only" : ""}>Qtd</FormLabel>
                                      <FormControl>
                                          <Input type="number" {...field} value={field.value as number} />
                                      </FormControl>
                                      <FormMessage />
                                  </FormItem>
                              )}
                          />
                          <Button 
                              type="button" 
                              variant="ghost" 
                              size="icon" 
                              className="text-red-500 hover:bg-red-50"
                              onClick={() => remove(index)}
                          >
                              <Trash2 className="h-4 w-4" />
                          </Button>
                      </div>
                  ))}
              </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
              <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
              <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="mr-2 h-4 w-4" /> 
                  {initialData ? 'Salvar Alterações' : 'Criar Estojo'}
              </Button>
          </div>
      </form>
    </Form>
  );
}