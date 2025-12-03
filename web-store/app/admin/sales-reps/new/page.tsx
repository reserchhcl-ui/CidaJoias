"use client";
import { useState } from 'react';
import { AdminService } from '@/src/lib/api/apiClient';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewSalesRepPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await AdminService.createSalesRep(formData);
      router.push('/admin/sales-reps');
    } catch (e) {
      alert("Erro ao criar vendedora.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Link href="/admin/sales-reps" className="flex items-center gap-2 text-slate-500 hover:text-slate-800 mb-6">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </Link>
      
      <h1 className="text-3xl font-bold text-slate-800 mb-8">Cadastrar Vendedora</h1>
      
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Email Corporativo</label>
          <input 
            type="email" 
            required
            className="w-full border border-slate-300 rounded-lg px-4 py-2"
            value={formData.email}
            onChange={e => setFormData({...formData, email: e.target.value})}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Senha Inicial</label>
          <input 
            type="password" 
            required
            className="w-full border border-slate-300 rounded-lg px-4 py-2"
            value={formData.password}
            onChange={e => setFormData({...formData, password: e.target.value})}
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-slate-900 text-white py-3 rounded-lg font-bold hover:bg-amber-600 transition-colors flex justify-center"
        >
          {loading ? <Loader2 className="animate-spin" /> : 'Criar Vendedora'}
        </button>
      </form>
    </div>
  );
}