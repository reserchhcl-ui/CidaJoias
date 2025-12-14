'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // Importar useRouter
import { useQuery } from '@tanstack/react-query';
import { Trash2, ArrowRight, Truck, Tag, Loader2, MapPin, PackageOpen } from 'lucide-react';
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
} from "@/components/ui/select";

import { useCartStore } from '@/store/use-cart-store';
import { useAuthStore } from '@/store/use-auth-store';
import { checkoutService } from '@/services/checkout-service';
import { addressService } from '@/services/address-service';
import { orderService } from '@/services/order-service'; // Importar OrderService
import { formatPrice, getImageUrl } from '@/lib/utils';
import { ShippingOption } from '@/types/cart';

export default function CartPage() {
  const router = useRouter();
  const cart = useCartStore();
  const { user } = useAuthStore();
  
  const [zipCode, setZipCode] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [isLoadingShipping, setIsLoadingShipping] = useState(false);
  const [isLoadingCoupon, setIsLoadingCoupon] = useState(false);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false); // Estado de loading do pedido
  const [isMounted, setIsMounted] = useState(false);

  // 1. Buscar Endereços
  const { data: addresses } = useQuery({
    queryKey: ['my-addresses'],
    queryFn: addressService.getMyAddresses,
    enabled: !!user,
  });

  useEffect(() => {
    useCartStore.persist.rehydrate();
    setIsMounted(true);
  }, []);

  const handleSimulateShipping = async (cepToUse?: string) => {
    const code = cepToUse || zipCode;
    
    // Se carrinho vazio, não calcula
    if (cart.items.length === 0) return;

    if (code.replace(/\D/g, '').length < 8) {
      // Só avisa erro se for interação manual (não no load automático)
      if (!cepToUse) toast.error("CEP inválido. Digite 8 números.");
      return;
    }
    
    setIsLoadingShipping(true);
    try {
      const options = await checkoutService.simulateShipping(code, cart.items);
      setShippingOptions(options);
      
      if (options.length > 0) {
         const currentSelected = cart.shippingOption;
         const stillExists = currentSelected && options.find(o => o.name === currentSelected.name);
         
         if (!stillExists) {
            cart.setShipping(options[0]);
         }
      }
    } catch (error) {
      if (!cepToUse) toast.error("Erro ao calcular frete.");
      setShippingOptions([]);
      cart.setShipping(null);
    } finally {
      setIsLoadingShipping(false);
    }
  };

  // --- USEEFFECT AGORA PODE ACESSAR A FUNÇÃO ACIMA ---
  useEffect(() => {
    // Só tenta calcular se tiver itens no carrinho e endereços carregados
    if (cart.items.length > 0 && addresses && addresses.length > 0 && !zipCode && !cart.shippingOption) {
      const defaultAddr = addresses.find(a => a.is_default) || addresses[0];
      setZipCode(defaultAddr.zip_code);
      handleSimulateShipping(defaultAddr.zip_code); 
    }
  }, [addresses, isMounted]); // Dependências ajustadas

  // Outros Handlers
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

  const handleCheckout = async () => {
    if (!cart.shippingOption) {
      toast.error("Por favor, calcule e selecione o frete antes de continuar.");
      return;
    }

    const selectedAddress = addresses?.find(a => a.zip_code === zipCode);
    
    if (!selectedAddress && zipCode.length >= 8) {
       // Se o usuário digitou CEP manual mas não tem login/endereço salvo no sistema
       // Aqui idealmente você forçaria o cadastro de endereço, mas vamos assumir o fluxo logado
       toast.error("Selecione um endereço cadastrado para entrega.");
       return;
    }

    if (!selectedAddress) {
        toast.error("Endereço inválido.");
        return;
    }

    setIsCreatingOrder(true);
    try {
      const order = await orderService.createOrder(
          cart.items, 
          selectedAddress.id, 
          cart.shippingOption.price
      );
      
      // Limpa carrinho pois virou pedido
      cart.clearCart(); 

      router.push(`/checkout?orderId=${order.id}`);
      
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.detail || "Erro ao criar pedido.";
      toast.error(msg);
    } finally {
      setIsCreatingOrder(false);
    }
  };

  if (!isMounted) return null;

  const subtotal = cart.getSubtotal();
  const total = cart.getTotal();
  const shippingCost = cart.shippingOption?.price || 0;
  const discountAmount = (subtotal + shippingCost) - total;

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="container mx-auto px-4 max-w-6xl">
        <h1 className="text-3xl font-bold mb-8 text-slate-800">Meu Carrinho</h1>

        {cart.items.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-lg shadow-sm border border-slate-100 flex flex-col items-center">
            <PackageOpen className="h-16 w-16 text-slate-300 mb-4" />
            <h2 className="text-2xl font-semibold mb-2 text-slate-700">Seu carrinho está vazio</h2>
            <p className="text-slate-500 mb-6">Parece que você ainda não adicionou nenhum item.</p>
            <Link href="/">
              <Button size="lg">Ir às compras</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* --- LISTA DE PRODUTOS --- */}
            <div className="lg:col-span-2 space-y-4">
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle>Produtos ({cart.items.length})</CardTitle>
                </CardHeader>
                <CardContent className="divide-y divide-slate-100">
                  {cart.items.map((item) => (
                    <div key={item.id} className="flex py-6 gap-4 md:gap-6 animate-in fade-in">
                       <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border bg-gray-50">
                        {item.image_url ? (
                            <img
                                src={getImageUrl(item.image_url)}
                                alt={item.name}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <div className="h-full w-full flex items-center justify-center text-slate-300"><PackageOpen /></div>
                        )}
                       </div>
                       
                       <div className="flex flex-1 flex-col justify-between">
                         <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-semibold text-slate-900 line-clamp-2">{item.name}</h3>
                                <p className="text-sm text-slate-500 mt-1">{item.category?.name}</p>
                            </div>
                            <p className="font-bold text-lg text-slate-900">
                                {formatPrice((item.current_price || item.selling_price) * item.quantity)}
                            </p>
                         </div>
                         
                         <div className="flex justify-between items-center mt-4">
                            <div className="flex items-center gap-3">
                                <span className="text-sm text-gray-600">Qtd:</span>
                                <Input 
                                    type="number" 
                                    className="w-16 h-8 text-center" 
                                    min={1} 
                                    max={item.stock_quantity}
                                    value={item.quantity}
                                    onChange={(e) => {
                                        const val = Number(e.target.value);
                                        if (val > 0) cart.updateQuantity(item.id, val);
                                    }}
                                />
                            </div>
                            <Button 
                                variant="ghost" 
                                size="sm"
                                className="text-slate-400 hover:text-red-600 hover:bg-red-50"
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

            {/* --- RESUMO E CHECKOUT --- */}
            <div className="space-y-6">
              <Card className="border-slate-200 shadow-lg sticky top-24">
                <CardHeader className="bg-slate-50 border-b border-slate-100">
                  <CardTitle className="text-lg">Resumo do Pedido</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Subtotal</span>
                    <span className="font-medium text-slate-900">{formatPrice(subtotal)}</span>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-slate-700">
                        <Truck className="h-4 w-4" />
                        <span className="font-medium text-sm">Entrega</span>
                    </div>

                    {user && addresses && addresses.length > 0 && (
                      <Select onValueChange={handleAddressSelect} defaultValue={addresses.find(a => a.is_default)?.id.toString()}>
                        <SelectTrigger className="w-full bg-white">
                          <SelectValue placeholder="Selecione um endereço" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="manual">Outro CEP...</SelectItem>
                          {addresses.map((addr) => (
                            <SelectItem key={addr.id} value={addr.id.toString()}>
                              {addr.name} - {addr.street}, {addr.number}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    <div className="flex gap-2">
                        <Input 
                            placeholder="00000-000" 
                            value={zipCode}
                            onChange={(e) => setZipCode(e.target.value)}
                            maxLength={9}
                            className="bg-white"
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
                            className="mt-2 space-y-2"
                        >
                            {shippingOptions.map((opt) => (
                                <div 
                                    key={opt.name} 
                                    className={`flex items-center space-x-2 border p-3 rounded-md cursor-pointer transition-colors ${cart.shippingOption?.name === opt.name ? 'border-blue-500 bg-blue-50' : 'hover:bg-slate-50 border-slate-200'}`}
                                    onClick={() => cart.setShipping(opt)}
                                >
                                    <RadioGroupItem value={opt.name} id={opt.name} />
                                    <Label htmlFor={opt.name} className="flex-1 flex justify-between cursor-pointer text-sm font-normal">
                                        <span className="text-slate-700">{opt.name} <span className="text-xs text-slate-500">({opt.estimated_days} dias)</span></span>
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

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-slate-700">
                        <Tag className="h-4 w-4" />
                        <span className="font-medium text-sm">Cupom de Desconto</span>
                    </div>
                    <div className="flex gap-2">
                        <Input 
                            placeholder="Código" 
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                            className="uppercase bg-white"
                        />
                        <Button variant="outline" onClick={handleApplyCoupon} disabled={isLoadingCoupon}>
                             {isLoadingCoupon ? <Loader2 className="h-4 w-4 animate-spin" /> : "Aplicar"}
                        </Button>
                    </div>
                    {cart.appliedCoupon && (
                        <div className="text-sm text-green-700 bg-green-100 border border-green-200 p-2 rounded flex justify-between items-center animate-in fade-in">
                            <span>Cupom <b>{cart.appliedCoupon.code}</b> aplicado!</span>
                            <button onClick={() => cart.setCoupon(null)} className="text-xs underline hover:text-green-900">Remover</button>
                        </div>
                    )}
                  </div>

                  <Separator />

                  <div className="space-y-2">
                     {cart.shippingOption && (
                        <div className="flex justify-between text-sm animate-in slide-in-from-right-2">
                            <span className="text-slate-600">Frete</span>
                            <span>{cart.shippingOption.price === 0 ? 'Grátis' : formatPrice(cart.shippingOption.price)}</span>
                        </div>
                     )}
                     
                     {Math.abs(discountAmount) > 0.01 && (
                        <div className="flex justify-between text-sm text-green-600 font-medium animate-in slide-in-from-right-2">
                            <span>Descontos</span>
                            <span>- {formatPrice(discountAmount)}</span>
                        </div>
                     )}

                     <div className="flex justify-between text-xl font-bold mt-4 pt-4 border-t border-slate-100">
                        <span>Total</span>
                        <span>{formatPrice(total)}</span>
                     </div>
                  </div>

                </CardContent>
                <CardFooter className="pb-6">
                    <Button 
                        onClick={handleCheckout}
                        disabled={!cart.shippingOption || isCreatingOrder}
                        className="w-full h-12 text-lg shadow-md hover:shadow-lg transition-all" 
                    >
                        {isCreatingOrder ? (
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        ) : (
                            <ArrowRight className="mr-2 h-5 w-5" />
                        )}
                        Ir para Pagamento
                    </Button>
                </CardFooter>
              </Card>
              
              {!cart.shippingOption && (
                  <div className="flex items-start gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 p-3 rounded-md">
                    <MapPin className="h-5 w-5 flex-shrink-0" />
                    <p>Por favor, selecione ou calcule o frete para prosseguir para o pagamento.</p>
                  </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}