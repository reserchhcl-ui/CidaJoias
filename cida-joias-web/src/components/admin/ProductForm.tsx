'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';

import { productService } from '@/services/product-service';
import { Product } from '@/types/product';

// Schema Validation
const productFormSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  description: z.string().optional(),
  selling_price: z.coerce.number().min(0.01, 'Preço de venda obrigatório'),
  cost_price: z.coerce.number().min(0.01, 'Preço de custo obrigatório'),
  stock_quantity: z.coerce.number().int().min(0, 'Estoque não pode ser negativo'),
  category_id: z.coerce.number().min(1, 'Selecione uma categoria'),
  barcode: z.string().optional(),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

// Props: Aceita dados iniciais (opcional)
interface ProductFormProps {
  initialData?: Product;
}

export function ProductForm({ initialData }: ProductFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Determina se é edição ou criação
  const isEditing = !!initialData;

  // 1. Buscar Categorias
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: productService.getCategories,
  });

  // 2. Configurar Formulário
  const form = useForm({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      selling_price: initialData?.selling_price || 0,
      cost_price: initialData?.cost_price || 0,
      stock_quantity: initialData?.stock_quantity || 0,
      barcode: initialData?.barcode || '', // O backend ignora se for string vazia na criação
      category_id: initialData?.category_id || 0,
    },
  });

  // Resetar formulário se initialData mudar (ex: carregamento assíncrono)
  useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name,
        description: initialData.description || '',
        selling_price: initialData.selling_price,
        cost_price: initialData.cost_price,
        stock_quantity: initialData.stock_quantity,
        barcode: initialData.barcode || '', 
        category_id: initialData.category_id || 0, // Fallback se vier null
      });
    }
  }, [initialData, form]);

  // 3. Handler de Envio Unificado
  async function onSubmit(data: any) {
    setIsSubmitting(true);
    const typedData = data as ProductFormValues;
    
    // Tratamento do Barcode: Se vazio, enviamos undefined para ativar o gerador do backend
    const payload = {
      ...typedData,
      category_id: Number(typedData.category_id),
      barcode: typedData.barcode === '' ? undefined : typedData.barcode,
    };

    try {
      let productId = initialData?.id;

      if (isEditing && productId) {
        // --- FLUXO DE EDIÇÃO ---
        await productService.updateProduct(productId, payload);
        toast.success('Produto atualizado com sucesso!');
      } else {
        // --- FLUXO DE CRIAÇÃO ---
        const newProduct = await productService.createProduct(payload);
        productId = newProduct.id;
        toast.success('Produto criado com sucesso!');
      }

      // Upload de Imagem (Comum aos dois)
      if (selectedImage && productId) {
        await productService.uploadImage(productId, selectedImage);
      }

      // Limpeza
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] }); // Home
      router.push('/admin/products');

    } catch (error) {
      console.error(error);
      toast.error(isEditing ? 'Erro ao atualizar.' : 'Erro ao criar.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-4xl">
        <div className="grid gap-6 md:grid-cols-2">
          
          {/* Esquerda */}
          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Produto</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Colar de Prata" {...field} value={field.value as string} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Detalhes..." {...field} value={(field.value as string) || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="category_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categoria</FormLabel>
                        <Select 
                          onValueChange={(val) => field.onChange(Number(val))}
                          value={field.value ? String(field.value) : undefined}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories?.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id.toString()}>
                                {cat.name}
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
                    name="stock_quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estoque</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} value={field.value as number} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <FormLabel>Imagem {isEditing && "(Envie nova para substituir)"}</FormLabel>
                
                {/* Preview da Imagem Atual (apenas na edição) */}
                {initialData?.image_url && !selectedImage && (
                   <div className="mb-4 mt-2">
                      <p className="text-xs text-muted-foreground mb-1">Imagem Atual:</p>
                      <img 
                        src={initialData.image_url.startsWith('http') ? initialData.image_url : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '')}${initialData.image_url}`} 
                        alt="Atual" 
                        className="h-32 w-auto object-cover rounded-md border" 
                      />
                   </div>
                )}

                <div className="mt-2">
                  <Input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => {
                       if (e.target.files?.[0]) setSelectedImage(e.target.files[0]);
                    }}
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    {selectedImage ? `Selecionado: ${selectedImage.name}` : "Nenhuma imagem nova selecionada"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Direita */}
          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="cost_price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preço Custo</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} value={field.value as number} />
                        </FormControl>
                        <FormDescription>R$</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="selling_price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preço Venda</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} value={field.value as number} />
                        </FormControl>
                        <FormDescription>R$</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="barcode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Código (SKU)</FormLabel>
                      <FormControl>
                         {/* Placeholder indicando a geração automática */}
                        <Input placeholder="Deixe vazio p/ gerar auto" {...field} value={(field.value as string) || ''} />
                      </FormControl>
                      <FormDescription>
                        Gerado automaticamente pelo servidor se vazio.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            {isEditing ? 'Salvar Alterações' : 'Criar Produto'}
          </Button>
        </div>
      </form>
    </Form>
  );
}