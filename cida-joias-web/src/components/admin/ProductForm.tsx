'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Save, RefreshCw, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient, useMutation } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';

// Importar o Form de Categoria para o Modal Rápido
import { CategoryForm } from '@/components/admin/CategoryForm';
import { productService } from '@/services/product-service';
import { ProductAdmin, Category } from '@/types/product';

const productSchema = z.object({
  name: z.string().min(3, "Nome obrigatório"),
  description: z.string().optional(),
  price: z.coerce.number().min(0.01, "Preço inválido"),
  selling_price: z.coerce.number().min(0.01, "Preço inválido"),
  stock_quantity: z.coerce.number().min(0, "Estoque inválido"),
  category_id: z.string().min(1, "Selecione uma categoria"),
  barcode: z.string().min(1, "Código obrigatório"),
  supplier_ref: z.string().optional(),
  image_url: z.string().optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductFormProps {
  initialData?: ProductAdmin;
  categories: Category[];
  onSubmit: (data: any) => void;
  isSubmitting: boolean;
  onCancel: () => void;
}

export function ProductForm({ initialData, categories, onSubmit, isSubmitting, onCancel }: ProductFormProps) {
  const queryClient = useQueryClient();
  const [isGeneratingBarcode, setIsGeneratingBarcode] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // --- LÓGICA DE APLANAR CATEGORIAS ---
  // Transforma a árvore em lista plana com indentação visual para o Select
  const flatCategories = useMemo(() => {
    const flatten = (cats: Category[], depth = 0): { id: string, name: string }[] => {
      let result: { id: string, name: string }[] = [];
      for (const cat of cats) {
        // Adiciona hífens visuais baseados na profundidade
        const prefix = depth > 0 ? '— '.repeat(depth) : '';
        result.push({ 
            id: cat.id.toString(), 
            name: `${prefix}${cat.name}` 
        });
        
        if (cat.sub_categories && cat.sub_categories.length > 0) {
          result = [...result, ...flatten(cat.sub_categories, depth + 1)];
        }
      }
      return result;
    };
    return flatten(categories);
  }, [categories]);

  const form = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      price: initialData?.cost_price || 0,
      selling_price: initialData?.selling_price || 0,
      stock_quantity: initialData?.stock_quantity || 0,
      category_id: initialData?.category_id ? initialData.category_id.toString() : '',
      barcode: initialData?.barcode || '',
      supplier_ref: initialData?.supplier_ref || '',
      image_url: initialData?.image_url || '',
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: productService.createCategory,
    onSuccess: (newCategory) => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      form.setValue('category_id', newCategory.id.toString());
      setIsCategoryModalOpen(false);
      toast.success("Categoria criada e selecionada!");
    },
    onError: () => toast.error("Erro ao criar categoria.")
  });

  const generateCode = async () => {
    setIsGeneratingBarcode(true);
    try {
      const code = await productService.generateBarcode();
      form.setValue('barcode', code);
    } catch (error) {
      toast.error("Erro ao gerar código.");
    } finally {
      setIsGeneratingBarcode(false);
    }
  };

  const handleRegenerateClick = (e: React.MouseEvent) => {
    e.preventDefault();
    generateCode();
    toast.info("Código regenerado.");
  };

  useEffect(() => {
    if (!initialData) {
      generateCode();
    }
  }, [initialData]);

  const handleSubmitWrapper = (data: ProductFormValues) => {
    // SANITIZAÇÃO DE DADOS (Payload Cleaning)
    // Garante que o Backend receba exatamente o que espera
    const payload = {
        ...data,
        // Conversão Forçada para Números (Backend odeia string em campo numérico)
        cost_price: Number(data.price),
        selling_price: Number(data.selling_price),
        stock_quantity: Number(data.stock_quantity),
        category_id: Number(data.category_id), // O Select retorna string, backend quer Int
        
        // Trata campos opcionais vazios
        // Se supplier_ref for "", envia null ou undefined (dependendo da regra do seu Pydantic)
        supplier_ref: data.supplier_ref || undefined, 
        description: data.description || undefined,
        image_url: data.image_url || undefined,
    };

    console.log("Enviando Payload:", payload); // Debug no Console do Navegador
    onSubmit(payload);
};

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmitWrapper)} className="space-y-6">
          
          {/* Nome e Código */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Produto</FormLabel>
                  <FormControl><Input placeholder="Ex: Colar de Prata" {...field} value={field.value as string} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
                control={form.control}
                name="barcode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código de Barras</FormLabel>
                    <div className="flex gap-2">
                        <FormControl>
                          <Input 
                              {...field} 
                              value={field.value as string}
                              readOnly 
                              className="bg-slate-100 text-slate-600 cursor-not-allowed font-mono"
                              placeholder="Gerando..."
                          />
                        </FormControl>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="icon"
                          onClick={handleRegenerateClick}
                          disabled={isGeneratingBarcode}
                          title="Regerar novo código"
                        >
                          {isGeneratingBarcode ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4 text-blue-600" />}
                        </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* CATEGORIA - Versão Dropdown Simples */}
              <FormField
                control={form.control}
                name="category_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex justify-between items-center">
                        Categoria
                        <span 
                            className="text-xs text-blue-600 cursor-pointer hover:underline flex items-center"
                            onClick={() => setIsCategoryModalOpen(true)}
                        >
                            <Plus className="h-3 w-3 mr-1" /> Nova
                        </span>
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value as string}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {flatCategories.length === 0 ? (
                            <SelectItem value="none" disabled>Nenhuma categoria cadastrada</SelectItem>
                        ) : (
                            flatCategories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                                {cat.name}
                            </SelectItem>
                            ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="supplier_ref"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ref. Fornecedor</FormLabel>
                    <FormControl><Input placeholder="Cód. Fábrica" {...field} value={field.value as string} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço de Custo</FormLabel>
                    <FormControl><Input type="number" step="0.01" {...field} value={field.value as number} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="selling_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço de Venda</FormLabel>
                    <FormControl><Input type="number" step="0.01" {...field} value={field.value as number} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="stock_quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estoque Inicial</FormLabel>
                    <FormControl><Input type="number" {...field} value={field.value as number} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
          </div>

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descrição</FormLabel>
                <FormControl><Textarea placeholder="Detalhes do produto..." {...field} value={field.value as string} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-4 border-t pt-4">
              <Button type="button" variant="ghost" onClick={onCancel} className="w-full sm:w-auto">Cancelar</Button>
              <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="mr-2 h-4 w-4" /> Salvar Produto
              </Button>
          </div>

        </form>
      </Form>

      {/* Modal Criar Categoria (Simplificado) */}
      <Dialog open={isCategoryModalOpen} onOpenChange={setIsCategoryModalOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px] w-full">
            <DialogHeader>
                <DialogTitle>Nova Categoria</DialogTitle>
            </DialogHeader>
            <CategoryForm 
                categoriesTree={categories} 
                isSubmitting={createCategoryMutation.isPending}
                onSubmit={(data) => createCategoryMutation.mutate(data)}
                onCancel={() => setIsCategoryModalOpen(false)}
            />
        </DialogContent>
      </Dialog>
    </>
  );
}