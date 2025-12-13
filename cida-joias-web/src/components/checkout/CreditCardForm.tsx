'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CreditCard, Lock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

// Schema de Validação
const cardSchema = z.object({
  number: z.string().min(16, "Número inválido").max(19).transform(v => v.replace(/\s/g, '')), // Remove espaços no submit
  holder_name: z.string().min(3, "Nome inválido"),
  expiry: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, "Formato MM/AA inválido"),
  cvv: z.string().min(3, "CVV inválido").max(4),
});

export type CardFormValues = z.infer<typeof cardSchema>;

interface CreditCardFormProps {
  onSubmit: (data: CardFormValues) => void;
  isProcessing: boolean;
  totalAmount: string;
}

export function CreditCardForm({ onSubmit, isProcessing, totalAmount }: CreditCardFormProps) {
  const form = useForm<CardFormValues>({
    resolver: zodResolver(cardSchema),
  });

  // Função simples de máscara para UI
  const formatCardNumber = (value: string) => {
    return value.replace(/\D/g, '').replace(/(\d{4})/g, '$1 ').trim().slice(0, 19);
  };

  const formatExpiry = (value: string) => {
    return value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1/$2').slice(0, 5);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 animate-in slide-in-from-right-4">
        
        <FormField
          control={form.control}
          name="number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Número do Cartão</FormLabel>
              <FormControl>
                <div className="relative">
                    <CreditCard className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input 
                        {...field} 
                        placeholder="0000 0000 0000 0000" 
                        className="pl-9 font-mono"
                        onChange={(e) => field.onChange(formatCardNumber(e.target.value))}
                        maxLength={19}
                    />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="holder_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome no Cartão</FormLabel>
              <FormControl>
                <Input {...field} placeholder="COMO ESTA NO CARTAO" className="uppercase" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="expiry"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Validade</FormLabel>
                <FormControl>
                    <Input 
                        {...field} 
                        placeholder="MM/AA" 
                        onChange={(e) => field.onChange(formatExpiry(e.target.value))}
                        maxLength={5}
                    />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />

            <FormField
            control={form.control}
            name="cvv"
            render={({ field }) => (
                <FormItem>
                <FormLabel>CVV</FormLabel>
                <FormControl>
                    <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <Input {...field} placeholder="123" className="pl-9" maxLength={4} type="password" />
                    </div>
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>

        <Button type="submit" className="w-full mt-4 bg-green-600 hover:bg-green-700 h-12 text-lg" disabled={isProcessing}>
            {isProcessing ? "Processando..." : `Pagar ${totalAmount}`}
        </Button>
        
        <p className="text-center text-xs text-slate-400 flex items-center justify-center gap-1">
            <Lock className="h-3 w-3" /> Pagamento 100% seguro e criptografado.
        </p>
      </form>
    </Form>
  );
}