// store/cart.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product } from '@/src/lib/types';

export interface CartItem extends Product {
  quantity: number;
}

interface CartState {
  items: CartItem[];
  isCartOpen: boolean;
  
  // Actions
  openCart: () => void;
  closeCart: () => void;
  addItem: (product: Product) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  
  // Getters (calculados)
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isCartOpen: false,

      openCart: () => set({ isCartOpen: true }),
      closeCart: () => set({ isCartOpen: false }),

      addItem: (product) => {
        const items = get().items;
        const existingItem = items.find((item) => item.id === product.id);

        if (existingItem) {
          // Se já existe, incrementa
          const updatedItems = items.map((item) =>
            item.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          );
          set({ items: updatedItems, isCartOpen: true }); // Abre o carrinho ao adicionar
        } else {
          // Se é novo, adiciona
          set({ items: [...items, { ...product, quantity: 1 }], isCartOpen: true });
        }
      },

      removeItem: (productId) => {
        set({ items: get().items.filter((item) => item.id !== productId) });
      },

      updateQuantity: (productId, quantity) => {
        if (quantity < 1) return;
        const updatedItems = get().items.map((item) =>
          item.id === productId ? { ...item, quantity } : item
        );
        set({ items: updatedItems });
      },

      clearCart: () => set({ items: [] }),

      getTotalItems: () => get().items.reduce((total, item) => total + item.quantity, 0),
      
      getTotalPrice: () => get().items.reduce((total, item) => {
        // Usa current_price (preço calculado pelo backend)
        return total + (item.current_price * item.quantity);
      }, 0),
    }),
    {
      name: 'cida-joias-cart', // Nome da chave no localStorage
    }
  )
);