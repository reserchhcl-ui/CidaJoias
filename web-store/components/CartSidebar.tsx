"use client";

import { useCartStore } from "@/src/lib/store/cart";
import { X, Minus, Plus, Trash2 } from "lucide-react"; // Removido Loader2 pois não processa mais aqui
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation"; // Importar useRouter

export default function CartSidebar() {
  const { 
    items, isCartOpen, closeCart, removeItem, updateQuantity, getTotalPrice 
  } = useCartStore();
  
  const router = useRouter(); // Hook de navegação

  const handleCheckoutRedirect = () => {
    closeCart(); // Fecha o sidebar
    router.push("/checkout"); // Navega para a página nova
  };

  const formatPrice = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  // Lógica de Imagem (replicada do ProductCard para consistência)
  const getImageUrl = (url: string | null) => {
    if (!url) return null;
    if (url.startsWith("http") || url.startsWith("https")) return url;
    let path = url.trim().replace(/\\/g, '/').replace(/^\/+/, '');
    if (!path.startsWith("Produtos_Images")) path = `Produtos_Images/${path}`;
    path = path.split('/').map(segment => encodeURIComponent(segment)).join('/');
    return `/${path}`;
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="fixed inset-0 bg-black/50 z-[60] backdrop-blur-sm"
          />

          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-white z-[70] shadow-2xl flex flex-col"
          >
            <div className="p-5 border-b flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-serif font-bold text-slate-900">Seu Carrinho ({items.length})</h2>
              <button onClick={closeCart} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <X className="w-6 h-6 text-slate-600" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                  <p>Seu carrinho está vazio.</p>
                  <button onClick={closeCart} className="text-amber-600 font-bold hover:underline">
                    Voltar às compras
                  </button>
                </div>
              ) : (
                items.map((item) => {
                  const imageSrc = getImageUrl(item.image_url);
                  const isLocalImage = imageSrc?.startsWith("/");
                  
                  return (
                    <div key={item.id} className="flex gap-4">
                      <div className="relative w-20 h-24 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
                        {imageSrc && (
                          <Image 
                            src={imageSrc} 
                            alt={item.name} 
                            fill 
                            className="object-cover"
                            unoptimized={isLocalImage}
                          />
                        )}
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
                  );
                })
              )}
            </div>

            {items.length > 0 && (
              <div className="p-5 border-t bg-slate-50 space-y-4">
                <div className="flex justify-between items-end">
                  <span className="text-slate-500">Subtotal</span>
                  <span className="text-2xl font-serif font-bold text-slate-900">
                    {formatPrice(getTotalPrice())}
                  </span>
                </div>
                {/* Botão Atualizado para Redirecionar */}
                <button 
                  onClick={handleCheckoutRedirect}
                  className="w-full bg-slate-900 text-white py-4 rounded-full font-bold text-lg hover:bg-amber-600 transition-colors"
                >
                  Finalizar Compra
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}