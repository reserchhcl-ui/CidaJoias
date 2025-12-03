"use client";

import { useState, useEffect } from 'react';
import { useCartStore } from '@/src/lib/store/cart';
import { CheckoutService } from '@/src/lib/api/apiClient'; // Usando o novo client
import { Address, ShippingOption } from '@/src/lib/types';
import { useRouter } from 'next/navigation';
import { Check, Truck, MapPin, CreditCard, ChevronRight, Loader2 } from 'lucide-react';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getTotalPrice, clearCart } = useCartStore();
  const [step, setStep] = useState(1); // 1: Address, 2: Shipping, 3: Review/Payment
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Dados do Pedido
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<ShippingOption | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [cardNumber, setCardNumber] = useState('');

  // Redireciona se carrinho vazio
  useEffect(() => {
    if (items.length === 0) {
      router.push('/');
    }
  }, [items, router]);

  // Passo 1: Carregar Endereços
  useEffect(() => {
    const loadAddresses = async () => {
      try {
        const data = await CheckoutService.getAddresses();
        setAddresses(data);
        const defaultAddr = data.find(a => a.is_default);
        if (defaultAddr) setSelectedAddress(defaultAddr);
      } catch (error) {
        console.error("Erro ao carregar endereços", error);
      }
    };
    loadAddresses();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Funções de Ação
  const handleCalculateShipping = async () => {
    if (!selectedAddress) {
      showToast("Por favor, selecione um endereço de entrega.");
      return;
    }
    
    setLoading(true);
    try {
      const payloadItems = items.map(i => ({ product_id: i.id, quantity: i.quantity }));
      const options = await CheckoutService.simulateShipping(selectedAddress.zip_code, payloadItems);
      setShippingOptions(options);
      setStep(2);
    } catch (e) {
      showToast("Erro ao calcular frete. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleValidateCoupon = async () => {
    if (!couponCode) return;
    setLoading(true);
    try {
      const currentTotal = getTotalPrice();
      const result = await CheckoutService.validateCoupon(couponCode, currentTotal);
      
      if (result.valid) {
        setDiscount(result.discount_amount);
        showToast(`Cupom aplicado! Desconto de R$ ${result.discount_amount.toFixed(2)}`);
      } else {
        setDiscount(0);
        showToast("Cupom inválido ou expirado.");
      }
    } catch (e) {
      showToast("Erro ao validar cupom.");
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!selectedShipping) {
      showToast("Selecione uma opção de frete.");
      return;
    }
    
    const lastDigit = cardNumber.slice(-1);
    // Mock de validação de cartão conforme regras do backend
    if (lastDigit === '2') {
      showToast("Pagamento Recusado: Saldo Insuficiente.");
      return;
    }

    setLoading(true);
    try {
      const totalAmount = getTotalPrice() + selectedShipping.price - discount;
      
      await CheckoutService.processPayment({
        amount: totalAmount,
        card_number: cardNumber,
        card_holder: "TEST USER", // Mock
        expiry: "12/30",
        cvv: "123",
        installments: 1
      });
      
      showToast("Pagamento Aprovado com Sucesso!");
      clearCart();
      setTimeout(() => router.push('/'), 2000); // Redireciona para home (ou página de sucesso)
    } catch (e) {
      showToast("Falha no processamento do pagamento.");
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const finalTotal = getTotalPrice() + (selectedShipping?.price || 0) - discount;

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-10">
      {/* Toast Simples */}
      {toastMessage && (
        <div className="fixed top-20 right-5 bg-slate-800 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-in fade-in slide-in-from-top-5">
          {toastMessage}
        </div>
      )}

      <div className="container mx-auto px-4 max-w-6xl">
        <h1 className="text-3xl font-serif font-bold text-slate-900 mb-8">Finalizar Pedido</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* COLUNA ESQUERDA: WIZARD */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Passo 1: Endereço */}
            <div className={`bg-white p-6 rounded-xl shadow-sm border ${step === 1 ? 'border-amber-500 ring-1 ring-amber-500' : 'border-slate-200'}`}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= 1 ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-500'}`}>1</div>
                <h2 className="text-xl font-bold text-slate-800">Endereço de Entrega</h2>
              </div>
              
              {step === 1 && (
                <div className="ml-11 space-y-4">
                  {addresses.length === 0 ? (
                    <p className="text-slate-500">Nenhum endereço cadastrado.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {addresses.map((addr) => (
                        <div 
                          key={addr.id}
                          onClick={() => setSelectedAddress(addr)}
                          className={`cursor-pointer p-4 rounded-lg border-2 transition-all ${selectedAddress?.id === addr.id ? 'border-amber-600 bg-amber-50' : 'border-slate-100 hover:border-amber-200'}`}
                        >
                          <div className="flex items-start gap-3">
                            <MapPin className={`w-5 h-5 mt-0.5 ${selectedAddress?.id === addr.id ? 'text-amber-600' : 'text-slate-400'}`} />
                            <div>
                              <p className="font-bold text-slate-900">{addr.name}</p>
                              <p className="text-sm text-slate-600">{addr.street}, {addr.number}</p>
                              <p className="text-sm text-slate-600">{addr.city} - {addr.state}</p>
                              <p className="text-sm text-slate-500 mt-1">{addr.zip_code}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <button 
                    onClick={handleCalculateShipping}
                    disabled={loading || !selectedAddress}
                    className="mt-4 px-6 py-3 bg-slate-900 text-white rounded-lg font-bold hover:bg-amber-600 transition-colors disabled:bg-slate-300 flex items-center gap-2"
                  >
                    {loading ? <Loader2 className="animate-spin" /> : "Continuar para Frete"}
                  </button>
                </div>
              )}
              {step > 1 && selectedAddress && (
                <div className="ml-11 flex justify-between items-center text-sm text-slate-600 bg-slate-50 p-3 rounded">
                  <p>{selectedAddress.street}, {selectedAddress.number} - {selectedAddress.city}</p>
                  <button onClick={() => setStep(1)} className="text-amber-600 font-bold hover:underline">Alterar</button>
                </div>
              )}
            </div>

            {/* Passo 2: Frete */}
            <div className={`bg-white p-6 rounded-xl shadow-sm border ${step === 2 ? 'border-amber-500 ring-1 ring-amber-500' : 'border-slate-200'}`}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= 2 ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-500'}`}>2</div>
                <h2 className="text-xl font-bold text-slate-800">Opções de Entrega</h2>
              </div>

              {step === 2 && (
                <div className="ml-11 space-y-4">
                  {shippingOptions.map((option) => (
                    <div 
                      key={option.name}
                      onClick={() => setSelectedShipping(option)}
                      className={`cursor-pointer p-4 rounded-lg border-2 flex justify-between items-center transition-all ${selectedShipping?.name === option.name ? 'border-amber-600 bg-amber-50' : 'border-slate-100 hover:border-amber-200'}`}
                    >
                      <div className="flex items-center gap-3">
                        <Truck className={`w-5 h-5 ${selectedShipping?.name === option.name ? 'text-amber-600' : 'text-slate-400'}`} />
                        <div>
                          <p className="font-bold text-slate-900">{option.name}</p>
                          <p className="text-sm text-slate-500">Estimativa: {option.estimated_days} dias úteis</p>
                        </div>
                      </div>
                      <span className="font-bold text-slate-900">{option.price === 0 ? "Grátis" : formatPrice(option.price)}</span>
                    </div>
                  ))}
                  
                  <button 
                    onClick={() => {
                      if(selectedShipping) setStep(3);
                      else showToast("Selecione um frete");
                    }}
                    className="mt-4 px-6 py-3 bg-slate-900 text-white rounded-lg font-bold hover:bg-amber-600 transition-colors"
                  >
                    Ir para Pagamento
                  </button>
                </div>
              )}
              {step > 2 && selectedShipping && (
                <div className="ml-11 flex justify-between items-center text-sm text-slate-600 bg-slate-50 p-3 rounded">
                  <p>{selectedShipping.name} ({selectedShipping.estimated_days} dias) - {selectedShipping.price === 0 ? "Grátis" : formatPrice(selectedShipping.price)}</p>
                  <button onClick={() => setStep(2)} className="text-amber-600 font-bold hover:underline">Alterar</button>
                </div>
              )}
            </div>

            {/* Passo 3: Pagamento */}
            <div className={`bg-white p-6 rounded-xl shadow-sm border ${step === 3 ? 'border-amber-500 ring-1 ring-amber-500' : 'border-slate-200'}`}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= 3 ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-500'}`}>3</div>
                <h2 className="text-xl font-bold text-slate-800">Pagamento</h2>
              </div>

              {step === 3 && (
                <div className="ml-11 space-y-6">
                  {/* Cupom */}
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Cupom de Desconto" 
                      className="flex-1 border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-amber-500 outline-none"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    />
                    <button 
                      onClick={handleValidateCoupon}
                      className="px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-300"
                    >
                      Aplicar
                    </button>
                  </div>

                  {/* Cartão de Crédito */}
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-2 mb-4 text-slate-700">
                      <CreditCard className="w-5 h-5" />
                      <span className="font-bold">Cartão de Crédito (Mock)</span>
                    </div>
                    <div className="space-y-3">
                      <input 
                        type="text" 
                        placeholder="Número do Cartão" 
                        className="w-full border border-slate-300 rounded-lg px-4 py-2"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <input type="text" placeholder="Validade (MM/AA)" className="border border-slate-300 rounded-lg px-4 py-2" />
                        <input type="text" placeholder="CVV" className="border border-slate-300 rounded-lg px-4 py-2" />
                      </div>
                      <input type="text" placeholder="Nome no Cartão" className="w-full border border-slate-300 rounded-lg px-4 py-2" />
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                      * Dica de Teste: Termine o cartão com <strong>1</strong> para aprovar, <strong>2</strong> para recusar.
                    </p>
                  </div>

                  <button 
                    onClick={handlePayment}
                    disabled={loading}
                    className="w-full py-4 bg-green-600 text-white rounded-lg font-bold text-lg hover:bg-green-700 shadow-lg hover:shadow-xl transition-all flex justify-center items-center gap-2"
                  >
                    {loading ? <Loader2 className="animate-spin" /> : `Pagar ${formatPrice(finalTotal)}`}
                  </button>
                </div>
              )}
            </div>

          </div>

          {/* COLUNA DIREITA: RESUMO */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 sticky top-24">
              <h3 className="text-lg font-bold text-slate-900 mb-4 border-b pb-2">Resumo do Pedido</h3>
              
              <div className="space-y-3 mb-6 max-h-60 overflow-y-auto pr-2">
                {items.map(item => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-slate-600 truncate flex-1 pr-2">{item.quantity}x {item.name}</span>
                    <span className="font-medium text-slate-900">{formatPrice(item.current_price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-2 border-t pt-4 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span>{formatPrice(getTotalPrice())}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Frete</span>
                  <span>{selectedShipping ? formatPrice(selectedShipping.price) : '--'}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600 font-bold">
                    <span>Desconto</span>
                    <span>- {formatPrice(discount)}</span>
                  </div>
                )}
              </div>

              <div className="border-t mt-4 pt-4 flex justify-between items-end">
                <span className="text-slate-600 font-bold">Total</span>
                <span className="text-2xl font-serif font-bold text-slate-900">{formatPrice(finalTotal)}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}