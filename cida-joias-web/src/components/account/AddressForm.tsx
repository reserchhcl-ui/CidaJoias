'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

import { Address, AddressFormValues, addressSchema } from '@/types/address';
import { addressService } from '@/services/address-service';

interface AddressFormProps {
  initialData?: Address;
  onSuccess: () => void;
  onCancel: () => void;
}

export function AddressForm({ initialData, onSuccess, onCancel }: AddressFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCep, setIsLoadingCep] = useState(false);

  // 1. CORREÇÃO: Removemos <AddressFormValues> para evitar conflito de tipos
  const form = useForm({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      name: initialData?.name || '',
      recipient_name: initialData?.recipient_name || '',
      zip_code: initialData?.zip_code || '',
      street: initialData?.street || '',
      number: initialData?.number || '',
      complement: initialData?.complement || '',
      neighborhood: initialData?.neighborhood || '',
      city: initialData?.city || '',
      state: initialData?.state || '',
      is_default: initialData?.is_default || false,
    },
  });

  const handleBlurCep = async () => {
    // Casting seguro para string, pois o input é text
    const cep = form.getValues('zip_code') as string;
    
    if (cep && cep.replace(/\D/g, '').length === 8) {
      setIsLoadingCep(true);
      try {
        const data = await addressService.fetchByCep(cep);
        if (data) {
          form.setValue('street', data.street);
          form.setValue('neighborhood', data.neighborhood);
          form.setValue('city', data.city);
          form.setValue('state', data.state);
          form.setFocus('number');
        }
      } catch (error) {
        toast.error("CEP não encontrado.");
      } finally {
        setIsLoadingCep(false);
      }
    }
  };

  // 2. CORREÇÃO: Recebemos 'data' como any e fazemos o cast para o tipo correto
  async function onSubmit(data: any) {
    const typedData = data as AddressFormValues;
    
    setIsLoading(true);
    try {
      if (initialData) {
        await addressService.updateAddress(initialData.id, typedData);
        toast.success("Endereço atualizado!");
      } else {
        await addressService.createAddress(typedData);
        toast.success("Endereço cadastrado!");
      }
      onSuccess();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar endereço.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Apelido do Local</FormLabel>
                <FormControl>
                    <Input placeholder="Ex: Casa, Trabalho" {...field} value={field.value as string} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="recipient_name"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Nome do Destinatário</FormLabel>
                <FormControl>
                    <Input placeholder="Quem vai receber?" {...field} value={field.value as string} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>

        <div className="grid grid-cols-3 gap-4">
            <FormField
            control={form.control}
            name="zip_code"
            render={({ field }) => (
                <FormItem>
                <FormLabel>CEP</FormLabel>
                <div className="relative">
                    <FormControl>
                        <Input 
                            placeholder="00000-000" 
                            {...field} 
                            value={field.value as string}
                            onBlur={handleBlurCep} 
                            maxLength={9}
                        />
                    </FormControl>
                    {isLoadingCep && (
                        <div className="absolute right-3 top-2.5">
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        </div>
                    )}
                </div>
                <FormMessage />
                </FormItem>
            )}
            />
             <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
                <FormItem className="col-span-1">
                <FormLabel>Cidade</FormLabel>
                <FormControl>
                    <Input {...field} value={field.value as string} readOnly className="bg-slate-50" />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
             <FormField
            control={form.control}
            name="state"
            render={({ field }) => (
                <FormItem>
                <FormLabel>UF</FormLabel>
                <FormControl>
                    <Input {...field} value={field.value as string} readOnly className="bg-slate-50" maxLength={2} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>

        <div className="grid grid-cols-4 gap-4">
            <FormField
            control={form.control}
            name="street"
            render={({ field }) => (
                <FormItem className="col-span-3">
                <FormLabel>Rua / Logradouro</FormLabel>
                <FormControl>
                    <Input {...field} value={field.value as string} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="number"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Número</FormLabel>
                <FormControl>
                    <Input {...field} value={field.value as string} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>

        <div className="grid grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="neighborhood"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Bairro</FormLabel>
                <FormControl>
                    <Input {...field} value={field.value as string} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="complement"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Complemento (Opcional)</FormLabel>
                <FormControl>
                    {/* Complemento pode ser undefined, garantimos string vazia */}
                    <Input placeholder="Apto 101, Bloco B" {...field} value={(field.value as string) || ''} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>

        <FormField
          control={form.control}
          name="is_default"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value as boolean}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  Endereço Padrão
                </FormLabel>
                <FormDescription>
                  Usar este endereço automaticamente no checkout.
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
            <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Endereço
            </Button>
        </div>
      </form>
    </Form>
  );
}