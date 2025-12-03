"use client";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { LayoutDashboard, Users, ShoppingBag, LogOut } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  // Proteção de Rota
  useEffect(() => {
    if (!loading) {
      if (!user || user.role !== 'admin') {
        router.push('/auth/login');
      }
    }
  }, [user, loading, router]);

  if (loading || !user) return <div className="min-h-screen flex items-center justify-center">Carregando Painel...</div>;

  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* Admin Sidebar */}
      <aside className="w-64 bg-slate-900 text-white fixed h-full">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-serif font-bold">Cida Admin</h1>
        </div>
        <nav className="p-4 space-y-2">
          <Link href="/admin" className="flex items-center gap-3 p-3 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors">
            <LayoutDashboard className="w-5 h-5" /> Dashboard
          </Link>
          <Link href="/admin/sales-reps" className="flex items-center gap-3 p-3 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors">
            <Users className="w-5 h-5" /> Vendedoras
          </Link>
          <Link href="/admin/products" className="flex items-center gap-3 p-3 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors">
            <ShoppingBag className="w-5 h-5" /> Produtos
          </Link>
          
          <button onClick={logout} className="flex items-center gap-3 p-3 rounded hover:bg-red-900/50 text-red-400 hover:text-red-200 w-full mt-10 transition-colors">
            <LogOut className="w-5 h-5" /> Sair
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="ml-64 flex-1 p-8">
        {children}
      </main>
    </div>
  );
}