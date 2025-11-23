"use client";

import { useCartStore } from "@/store/cart";
import { X, Minus, Plus, Trash2, Loader2 } from "lucide-react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

export default function CartSidebar() {
  const { 
    items, isCartOpen, closeCart, removeItem, updateQuantity, getTotalPrice, clearCart 
  } = useCartStore();
  
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // Função de Checkout integrada ao Backend Python
  const handleCheckout = async () => {
    setIsCheckingOut(true);
    
    const payload = {
      items: items.map(item => ({
        product_id: item.id,
        quantity: item.quantity
      }))
    };

    try {
      const response = await fetch('http://127.0.0.1:8000/api/v1/orders/pedidos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Em um cenário real, enviaríamos o token do usuário aqui se necessário
          // 'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Erro no checkout');

      const data = await response.json();
      alert(`Pedido #${data.id} realizado com sucesso!`);
      clearCart();
      closeCart();
    } catch (error) {
      console.error(error);
      alert("Erro ao processar pedido. Verifique o estoque.");
    } finally {
      setIsCheckingOut(false);
    }
  };

  // Formatação de moeda
  const formatPrice = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Backdrop (fundo escuro) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="fixed inset-0 bg-black/50 z-[60] backdrop-blur-sm"
          />

          {/* Sidebar deslizante */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-white z-[70] shadow-2xl flex flex-col"
          >
            {/* Header do Carrinho */}
            <div className="p-5 border-b flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-serif font-bold text-slate-900">Seu Carrinho ({items.length})</h2>
              <button onClick={closeCart} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <X className="w-6 h-6 text-slate-600" />
              </button>
            </div>

            {/* Lista de Itens */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                  <p>Seu carrinho está vazio.</p>
                  <button onClick={closeCart} className="text-amber-600 font-bold hover:underline">
                    Voltar às compras
                  </button>
                </div>
              ) : (
                items.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="relative w-20 h-24 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
                      <Image 
                        src={item.image_url || "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=200&q=80"} 
                        alt={item.name} 
                        fill 
                        className="object-cover" 
                      />
                    </div>
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-medium text-slate-900 line-clamp-2">{item.name}</h3>
                        <p className="text-amber-600 font-bold">{formatPrice(item.current_price)}</p>
                      </div>
                      
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center border rounded-lg">
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="p-1.5 hover:bg-slate-100 text-slate-600"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="p-1.5 hover:bg-slate-100 text-slate-600"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        <button 
                          onClick={() => removeItem(item.id)}
                          className="text-red-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer / Checkout */}
            {items.length > 0 && (
              <div className="p-5 border-t bg-slate-50 space-y-4">
                <div className="flex justify-between items-end">
                  <span className="text-slate-500">Subtotal</span>
                  <span className="text-2xl font-serif font-bold text-slate-900">
                    {formatPrice(getTotalPrice())}
                  </span>
                </div>
                <button 
                  onClick={handleCheckout}
                  disabled={isCheckingOut}
                  className="w-full bg-slate-900 text-white py-4 rounded-full font-bold text-lg hover:bg-amber-600 disabled:bg-slate-400 transition-colors flex justify-center items-center gap-2"
                >
                  {isCheckingOut ? (
                    <> <Loader2 className="w-5 h-5 animate-spin" /> Processando... </>
                  ) : (
                    "Finalizar Compra"
                  )}
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}