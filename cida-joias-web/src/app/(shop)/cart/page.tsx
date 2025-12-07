'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query'; // Importante para buscar endereços
import { Trash2, ArrowRight, Truck, Tag, Loader2, MapPin } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"; // Componente novo para seleção

import { useCartStore } from '@/store/use-cart-store';
import { useAuthStore } from '@/store/use-auth-store'; // Para saber se está logado
import { checkoutService } from '@/services/checkout-service';
import { addressService } from '@/services/address-service'; // Serviço de Endereços
import { formatPrice, getImageUrl } from '@/lib/utils';
import { ShippingOption } from '@/types/cart';

export default function CartPage() {
  const cart = useCartStore();
  const { user } = useAuthStore();
  
  const [zipCode, setZipCode] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [isLoadingShipping, setIsLoadingShipping] = useState(false);
  const [isLoadingCoupon, setIsLoadingCoupon] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // 1. Buscar Endereços do Usuário (Se logado)
  const { data: addresses } = useQuery({
    queryKey: ['my-addresses'],
    queryFn: addressService.getMyAddresses,
    enabled: !!user, // Só busca se tiver usuário
  });

  useEffect(() => {
    useCartStore.persist.rehydrate();
    setIsMounted(true);
  }, []);

  // 2. Auto-selecionar Endereço Padrão ao carregar
  useEffect(() => {
    if (addresses && addresses.length > 0 && !zipCode) {
      const defaultAddr = addresses.find(a => a.is_default) || addresses[0];
      setZipCode(defaultAddr.zip_code);
      // Opcional: Já simular o frete automaticamente
      // handleSimulateShipping(defaultAddr.zip_code); 
    }
  }, [addresses]); // Roda quando os endereços são carregados

  if (!isMounted) return null;

  // Modifiquei para aceitar cep opcional (para chamadas automáticas)
  const handleSimulateShipping = async (cepToUse?: string) => {
    const code = cepToUse || zipCode;
    
    if (code.replace(/\D/g, '').length < 8) {
      toast.error("CEP inválido");
      return;
    }
    
    setIsLoadingShipping(true);
    try {
      const options = await checkoutService.simulateShipping(code, cart.items);
      setShippingOptions(options);
      
      if (options.length > 0) {
         // Se já tinha uma opção selecionada, tenta manter, senão pega a primeira
         const currentSelected = cart.shippingOption;
         const stillExists = options.find(o => o.name === currentSelected?.name);
         
         if (!currentSelected || !stillExists) {
            cart.setShipping(options[0]);
         }
      }
    } catch (error) {
      toast.error("Erro ao calcular frete.");
      setShippingOptions([]);
    } finally {
      setIsLoadingShipping(false);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    setIsLoadingCoupon(true);
    try {
      const coupon = await checkoutService.validateCoupon(couponCode, cart.getSubtotal());
      cart.setCoupon(coupon);
      toast.success("Cupom aplicado com sucesso!");
    } catch (error) {
      toast.error("Cupom inválido ou expirado.");
      cart.setCoupon(null);
    } finally {
      setIsLoadingCoupon(false);
    }
  };

  // Handler para quando o usuário escolhe um endereço na lista
  const handleAddressSelect = (addressId: string) => {
    if (addressId === 'manual') {
      setZipCode('');
      setShippingOptions([]);
      cart.setShipping(null);
      return;
    }

    const selected = addresses?.find(a => a.id.toString() === addressId);
    if (selected) {
      setZipCode(selected.zip_code);
      handleSimulateShipping(selected.zip_code);
      toast.info(`Endereço "${selected.name}" selecionado.`);
    }
  };

  const subtotal = cart.getSubtotal();
  const total = cart.getTotal();
  const discountAmount = subtotal + (cart.shippingOption?.price || 0) - total;

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Meu Carrinho</h1>

        {cart.items.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-lg shadow">
            <h2 className="text-2xl font-semibold mb-4">Seu carrinho está vazio</h2>
            <Link href="/">
              <Button>Ir as compras</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Lista de Itens */}
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Produtos ({cart.items.length})</CardTitle>
                </CardHeader>
                <CardContent className="divide-y">
                  {cart.items.map((item) => (
                    <div key={item.id} className="flex py-6 gap-4">
                       <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border bg-gray-100">
                        <img
                            src={getImageUrl(item.image_url)}
                            alt={item.name}
                            className="h-full w-full object-cover"
                        />
                       </div>
                       <div className="flex flex-1 flex-col justify-between">
                         <div className="flex justify-between">
                            <div>
                                <h3 className="font-medium">{item.name}</h3>
                                <p className="text-sm text-gray-500">{item.category?.name}</p>
                            </div>
                            <p className="font-bold text-lg">
                                {formatPrice((item.current_price || item.selling_price) * item.quantity)}
                            </p>
                         </div>
                         
                         <div className="flex justify-between items-center mt-4">
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600">Qtd:</span>
                                <Input 
                                    type="number" 
                                    className="w-16 h-8" 
                                    min={1} 
                                    max={item.stock_quantity}
                                    value={item.quantity}
                                    onChange={(e) => cart.updateQuantity(item.id, Number(e.target.value))}
                                />
                            </div>
                            <Button 
                                variant="ghost" 
                                className="text-red-500 hover:text-red-700"
                                onClick={() => cart.removeItem(item.id)}
                            >
                                <Trash2 className="h-4 w-4 mr-2" /> Remover
                            </Button>
                         </div>
                       </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Resumo e Frete */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Resumo do Pedido</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">{formatPrice(subtotal)}</span>
                  </div>

                  <Separator />

                  {/* FRETE INTELIGENTE */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4 text-gray-500" />
                        <span className="font-medium text-sm">Entrega</span>
                    </div>

                    {/* Seletor de Endereços (Apenas se logado e com endereços) */}
                    {user && addresses && addresses.length > 0 && (
                      <div className="mb-3">
                        <Select onValueChange={handleAddressSelect} defaultValue={addresses.find(a => a.is_default)?.id.toString()}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Selecione um endereço" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="manual">Digitar outro CEP...</SelectItem>
                            {addresses.map((addr) => (
                              <SelectItem key={addr.id} value={addr.id.toString()}>
                                {addr.name} ({addr.street}, {addr.number})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="flex gap-2">
                        <Input 
                            placeholder="CEP (00000-000)" 
                            value={zipCode}
                            onChange={(e) => setZipCode(e.target.value)}
                            maxLength={9}
                            // Se selecionou endereço salvo, pode deixar readonly para evitar confusão ou liberar
                        />
                        <Button variant="outline" onClick={() => handleSimulateShipping()} disabled={isLoadingShipping}>
                            {isLoadingShipping ? <Loader2 className="h-4 w-4 animate-spin" /> : "Calcular"}
                        </Button>
                    </div>

                    {shippingOptions.length > 0 && (
                        <RadioGroup 
                            value={cart.shippingOption?.name} 
                            onValueChange={(val) => {
                                const opt = shippingOptions.find(o => o.name === val);
                                if (opt) cart.setShipping(opt);
                            }}
                            className="mt-2"
                        >
                            {shippingOptions.map((opt) => (
                                <div key={opt.name} className="flex items-center space-x-2 border p-3 rounded-md cursor-pointer hover:bg-gray-50">
                                    <RadioGroupItem value={opt.name} id={opt.name} />
                                    <Label htmlFor={opt.name} className="flex-1 flex justify-between cursor-pointer text-sm">
                                        <span>{opt.name} ({opt.estimated_days} dias)</span>
                                        <span className="font-bold text-green-700">
                                            {opt.price === 0 ? 'Grátis' : formatPrice(opt.price)}
                                        </span>
                                    </Label>
                                </div>
                            ))}
                        </RadioGroup>
                    )}
                  </div>

                  <Separator />

                  {/* Cupom */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-gray-500" />
                        <span className="font-medium text-sm">Cupom de Desconto</span>
                    </div>
                    <div className="flex gap-2">
                        <Input 
                            placeholder="Código" 
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        />
                        <Button variant="outline" onClick={handleApplyCoupon} disabled={isLoadingCoupon}>
                             {isLoadingCoupon ? <Loader2 className="h-4 w-4 animate-spin" /> : "Aplicar"}
                        </Button>
                    </div>
                    {cart.appliedCoupon && (
                        <div className="text-sm text-green-600 bg-green-50 p-2 rounded flex justify-between">
                            <span>Cupom aplicado: {cart.appliedCoupon.code}</span>
                            <button onClick={() => cart.setCoupon(null)} className="text-xs underline">Remover</button>
                        </div>
                    )}
                  </div>

                  <Separator />

                  <div className="space-y-2">
                     {cart.shippingOption && (
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Frete</span>
                            <span>{cart.shippingOption.price === 0 ? 'Grátis' : formatPrice(cart.shippingOption.price)}</span>
                        </div>
                     )}
                     {discountAmount > 0 && (
                        <div className="flex justify-between text-sm text-green-600">
                            <span>Descontos</span>
                            <span>- {formatPrice(discountAmount)}</span>
                        </div>
                     )}
                     <div className="flex justify-between text-xl font-bold mt-2">
                        <span>Total</span>
                        <span>{formatPrice(total)}</span>
                     </div>
                  </div>

                </CardContent>
                <CardFooter>
                    {/* Botão de Fechar Pedido: Só habilita se frete estiver escolhido */}
                    <Button className="w-full h-12 text-lg" disabled={!cart.shippingOption}>
                        Fechar Pedido <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                </CardFooter>
              </Card>
              
              {/* Avisos de UX */}
              {!cart.shippingOption && (
                  <p className="text-xs text-red-500 text-center bg-red-50 p-2 rounded">
                    <MapPin className="inline h-3 w-3 mr-1" />
                    Selecione um endereço e calcule o frete para continuar.
                  </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}