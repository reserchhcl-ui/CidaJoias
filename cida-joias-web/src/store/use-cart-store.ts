import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { CartItem, ShippingOption, Coupon } from '@/types/cart';
import { toast } from 'sonner';
import { useAuthStore } from './use-auth-store'; // Importar a store de Auth

interface CartState {
  items: CartItem[];
  shippingOption: ShippingOption | null;
  appliedCoupon: Coupon | null;
  
  // Actions
  addItem: (product: any) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  setShipping: (option: ShippingOption | null) => void;
  setCoupon: (coupon: Coupon | null) => void;
  clearCart: () => void;
  
  // Getters
  getSubtotal: () => number;
  getTotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      shippingOption: null,
      appliedCoupon: null,

      addItem: (product) => {
        const currentItems = get().items;
        const existingItem = currentItems.find((item) => item.id === product.id);

        if (existingItem) {
          if (existingItem.quantity >= product.stock_quantity) {
             toast.error("Estoque máximo atingido para este item.");
             return;
          }
          
          set({
            items: currentItems.map((item) =>
              item.id === product.id
                ? { ...item, quantity: item.quantity + 1 }
                : item
            ),
          });
          toast.success("Quantidade atualizada.");
        } else {
          set({ items: [...currentItems, { ...product, quantity: 1 }] });
          toast.success("Adicionado ao carrinho!");
        }
      },

      removeItem: (productId) => {
        set({
          items: get().items.filter((item) => item.id !== productId),
        });
        toast.info("Item removido.");
      },

      updateQuantity: (productId, quantity) => {
        const { items } = get();
        const item = items.find((i) => i.id === productId);
        
        if (!item) return;

        if (quantity > item.stock_quantity) {
            toast.warning(`Apenas ${item.stock_quantity} unidades disponíveis.`);
            quantity = item.stock_quantity;
        }

        if (quantity <= 0) {
            get().removeItem(productId);
            return;
        }

        set({
          items: items.map((i) => (i.id === productId ? { ...i, quantity } : i)),
        });
      },

      setShipping: (option) => set({ shippingOption: option }),
      
      setCoupon: (coupon) => set({ appliedCoupon: coupon }),

      clearCart: () => set({ items: [], shippingOption: null, appliedCoupon: null }),

      getSubtotal: () => {
        return get().items.reduce((acc, item) => {
             const price = item.current_price || item.selling_price;
             return acc + (price * item.quantity);
        }, 0);
      },

      getTotal: () => {
        const subtotal = get().getSubtotal();
        const shipping = get().shippingOption?.price || 0;
        let discount = 0;
        
        const coupon = get().appliedCoupon;
        if (coupon) {
            if (coupon.discount_type === 'percentage') {
                discount = subtotal * (coupon.discount_value / 100);
            } else {
                discount = coupon.discount_value;
            }
        }

        return Math.max(0, subtotal + shipping - discount);
      }
    }),
    {
      name: 'cidajoias-active-session', // Mudamos o nome para refletir que é a sessão ativa
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    }
  )
);
// Função auxiliar para mesclar itens (Soma quantidades se o item já existir)
function mergeCartItems(guestItems: CartItem[], userSavedItems: CartItem[]): CartItem[] {
  // Começamos com uma cópia dos itens salvos do usuário
  const merged = [...userSavedItems];

  guestItems.forEach((guestItem) => {
    const existingItemIndex = merged.findIndex((i) => i.id === guestItem.id);

    if (existingItemIndex > -1) {
      // Se o item já existe na conta do usuário, somamos a quantidade
      const existingItem = merged[existingItemIndex];
      const newQuantity = existingItem.quantity + guestItem.quantity;
      
      // Validação básica de estoque (usa o do item mais recente)
      const maxStock = guestItem.stock_quantity; 
      
      merged[existingItemIndex] = {
        ...existingItem,
        quantity: newQuantity > maxStock ? maxStock : newQuantity,
      };
    } else {
      // Se não existe, adicionamos o item do visitante à lista
      merged.push(guestItem);
    }
  });

  return merged;
}

// --- SINCRONIZAÇÃO INTELIGENTE DE CARRINHO ---
useAuthStore.subscribe((state, prevState) => {
  const newUser = state.user;
  const oldUser = prevState.user;

  // Se não houve mudança real de usuário, ignora
  if (newUser?.id === oldUser?.id) return;

  const store = useCartStore.getState();

  // CENÁRIO 1: LOGOUT (Usuário -> Visitante)
  if (oldUser && !newUser) {
    // 1. Salva o carrinho atual na conta do usuário que está saindo
    const userCartData = JSON.stringify({
      items: store.items,
      shippingOption: store.shippingOption,
      appliedCoupon: store.appliedCoupon
    });
    localStorage.setItem(`cart_user_${oldUser.id}`, userCartData);

    // 2. Limpa o carrinho atual para o visitante (ou carrega um antigo de visitante se quiser)
    // Aqui optamos por limpar para garantir privacidade se for um computador compartilhado
    store.clearCart();
    
    // (Opcional) Se quiser recuperar o carrinho de visitante anterior:
    // const guestCart = localStorage.getItem('cart_guest');
    // if (guestCart) useCartStore.setState(JSON.parse(guestCart));
  }

  // CENÁRIO 2: LOGIN (Visitante -> Usuário)
  if (!oldUser && newUser) {
    // Itens que o visitante selecionou ANTES de logar
    const currentGuestItems = store.items;
    
    // Tenta buscar carrinho antigo deste usuário
    const savedUserCartStr = localStorage.getItem(`cart_user_${newUser.id}`);
    
    let finalItems: CartItem[] = [];
    let finalCoupon = store.appliedCoupon; // Preferência para o cupom que o guest acabou de colocar
    let finalShipping = store.shippingOption;

    if (savedUserCartStr) {
      const savedUserCart = JSON.parse(savedUserCartStr);
      
      // AQUI A MÁGICA: Mescla o carrinho do Guest com o do Usuário
      if (currentGuestItems.length > 0) {
        finalItems = mergeCartItems(currentGuestItems, savedUserCart.items || []);
        toast.success("Seus itens foram adicionados ao carrinho salvo!");
      } else {
        // Se o guest não tinha nada, só carrega o do usuário
        finalItems = savedUserCart.items || [];
      }

      // Se o guest não tinha cupom, mas o usuário tinha salvo, restaura o do usuário
      if (!finalCoupon) finalCoupon = savedUserCart.appliedCoupon;

    } else {
      // Se usuário novo (sem histórico), ele assume o carrinho do Guest
      finalItems = currentGuestItems;
    }

    // Atualiza a store com os dados mesclados
    useCartStore.setState({
      items: finalItems,
      appliedCoupon: finalCoupon,
      shippingOption: finalShipping // Mantém o frete calculado recentemente pelo guest
    });

    // Limpa o carrinho "guest" do localStorage para não misturar depois
    localStorage.removeItem('cart_guest');
  }
});