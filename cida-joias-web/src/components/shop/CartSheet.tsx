'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose
} from '@/components/ui/sheet';

import { useCartStore } from '@/store/use-cart-store';
import { formatPrice, getImageUrl } from '@/lib/utils';

export function CartSheet() {
  const [isMounted, setIsMounted] = useState(false);
  const cart = useCartStore();
  
  // Hidratação manual para Zustand + Next.js
  useEffect(() => {
    useCartStore.persist.rehydrate();
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  const itemCount = cart.items.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = cart.getSubtotal();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative hover:bg-slate-100 rounded-full">
          <ShoppingCart className="h-5 w-5 text-slate-700" />
          {itemCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 bg-primary text-white text-xs font-bold rounded-full flex items-center justify-center">
              {itemCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent className="flex flex-col w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" /> Seu Carrinho ({itemCount})
          </SheetTitle>
        </SheetHeader>

        {cart.items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
            <ShoppingCart className="h-16 w-16 mb-4 opacity-20" />
            <p>Seu carrinho está vazio.</p>
            <SheetClose asChild>
                <Button variant="link" className="mt-2">Continuar comprando</Button>
            </SheetClose>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 -mx-3 px-6 py-4">
              <div className="space-y-5">
                {cart.items.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="h-30 w-20 flex-shrink-0 overflow-hidden rounded-md border bg-slate-50">
                      <img
                        src={getImageUrl(item.image_url)}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex flex-1 flex-col justify-between">
                      <div className="flex justify-between">
                        <div>
                          <h3 className="font-medium text-sm line-clamp-1">{item.name}</h3>
                          <p className="text-xs text-slate-500">{item.category?.name}</p>
                        </div>
                        <p className="text-sm font-bold">
                            {formatPrice((item.current_price || item.selling_price) * item.quantity)}
                        </p>
                      </div>
                      
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center border rounded-md">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 rounded-none"
                            onClick={() => cart.updateQuantity(item.id, item.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center text-xs">{item.quantity}</span>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 rounded-none"
                            onClick={() => cart.updateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => cart.removeItem(item.id)}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="pt-1">
              <Separator className="mb-4" />
              <div className="px-3 flex justify-between text-base font-medium mb-4">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <SheetFooter>
                <SheetClose asChild>
                    <Link href="/cart" className="w-full">
                        <Button className="w-full h-12 text-lg">
                            Finalizar Compra <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </Link>
                </SheetClose>
              </SheetFooter>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}