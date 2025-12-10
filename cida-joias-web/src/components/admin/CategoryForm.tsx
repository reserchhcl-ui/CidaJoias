'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Save } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

import { Category } from '@/types/product';

const categorySchema = z.object({
  name: z.string().min(3, 'Nome muito curto'),
  slug: z.string().min(3, 'Slug muito curto').regex(/^[a-z0-9-]+$/, 'Use apenas letras minúsculas e hífens'),
  description: z.string().optional(),
  parent_id: z.string().optional(), // Select retorna string, converteremos para number/null
});

type CategoryFormValues = z.infer<typeof categorySchema>;

interface CategoryFormProps {
  initialData?: Category;
  categoriesTree: Category[]; // Árvore completa para o Select de Pai
  onSubmit: (data: any) => void;
  isSubmitting: boolean;
  onCancel: () => void;
}

export function CategoryForm({ initialData, categoriesTree, onSubmit, isSubmitting, onCancel }: CategoryFormProps) {
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: initialData?.name || '',
      slug: initialData?.slug || '',
      description: initialData?.description || '',
      parent_id: initialData?.parent_id ? initialData.parent_id.toString() : 'root',
    },
  });

  // Função auxiliar para "Aplanar" a árvore para o Select
  // Transforma: [{name: 'A', sub: [{name: 'B'}]}] -> [{id: 1, label: 'A'}, {id: 2, label: '— B'}]
  const flattenOptions = (cats: Category[], depth = 0): { id: string; label: string }[] => {
    let options: { id: string; label: string }[] = [];
    
    cats.forEach(cat => {
      // Impede selecionar a si mesmo como pai (evitar loop infinito na edição)
      if (initialData && cat.id === initialData.id) return;

      const prefix = '— '.repeat(depth);
      options.push({ id: cat.id.toString(), label: `${prefix}${cat.name}` });
      
      if (cat.sub_categories && cat.sub_categories.length > 0) {
        options = [...options, ...flattenOptions(cat.sub_categories, depth + 1)];
      }
    });
    
    return options;
  };

  const parentOptions = flattenOptions(categoriesTree);

  const handleSubmit = (data: CategoryFormValues) => {
    // Converter 'root' para null
    const payload = {
      ...data,
      parent_id: data.parent_id === 'root' ? null : Number(data.parent_id),
    };
    onSubmit(payload);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              <FormControl><Input {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Slug (URL)</FormLabel>
              <FormControl><Input placeholder="ex: moda-verao" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="parent_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoria Pai</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="root" className="font-semibold text-primary">
                    • Nenhuma (Raiz)
                  </SelectItem>
                  {parentOptions.map((opt) => (
                    <SelectItem key={opt.id} value={opt.id}>
                      {opt.label}
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
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição (SEO)</FormLabel>
              <FormControl>
                <Textarea placeholder="Descrição para motores de busca..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-2">
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