import api from '@/lib/api';

export interface DashboardStats {
  usersCount: number;
  ordersCount: number;
  productsCount: number;
  revenue: number;
}

export const adminService = {
  // Busca estatísticas gerais (requer permissão de Admin)
  getStats: async (): Promise<DashboardStats> => {
    // Executamos as chamadas em paralelo para performance
    const [usersRes, ordersRes, productsRes] = await Promise.all([
      api.get('/users/?skip=0&limit=1000'), // Limite alto para contar (ideal seria endpoint de count)
      api.get('/orders/'),
      api.get('/products/?limit=1000') // Esse é público, mas compõe o dashboard
    ]);

    const users = usersRes.data;
    const orders = ordersRes.data;
    const products = productsRes.data;

    // Calcular receita total (apenas pedidos pagos/enviados)
    // Ajuste o status conforme sua regra de negócio ('paid', 'shipped', 'delivered')
    const revenue = orders
      .filter((o: any) => ['paid', 'shipped', 'delivered'].includes(o.status))
      .reduce((acc: number, curr: any) => acc + (curr.total_amount || 0), 0);

    return {
      usersCount: users.length,
      ordersCount: orders.length,
      productsCount: products.length,
      revenue
    };
  }
};