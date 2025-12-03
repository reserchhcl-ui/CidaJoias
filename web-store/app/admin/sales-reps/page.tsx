"use client";
import { useState, useEffect } from 'react';
import { AdminService } from '@/src/lib/api/apiClient';
import { User } from '@/src/lib/types';
import { Plus, Trash2, Search } from 'lucide-react';
import Link from 'next/link';

export default function SalesRepsPage() {
  const [reps, setReps] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReps();
  }, []);

  const loadReps = async () => {
    try {
      const data = await AdminService.getSalesReps();
      setReps(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if(!confirm("Tem certeza que deseja remover esta vendedora?")) return;
    try {
      await AdminService.deleteUser(id);
      loadReps();
    } catch (e) {
      alert("Erro ao excluir (Backend não implementou DELETE ainda)");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-800">Vendedoras</h1>
        <Link 
          href="/admin/sales-reps/new"
          className="bg-amber-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-amber-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> Nova Vendedora
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="p-4 font-semibold text-slate-600">ID</th>
              <th className="p-4 font-semibold text-slate-600">Email</th>
              <th className="p-4 font-semibold text-slate-600">Status</th>
              <th className="p-4 font-semibold text-slate-600 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {reps.map((rep) => (
              <tr key={rep.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                <td className="p-4 text-slate-500">#{rep.id}</td>
                <td className="p-4 font-medium text-slate-900">{rep.email}</td>
                <td className="p-4"><span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">ATIVO</span></td>
                <td className="p-4 text-right">
                  <button 
                    onClick={() => handleDelete(rep.id)}
                    className="text-slate-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
            {reps.length === 0 && !loading && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-slate-500">Nenhuma vendedora encontrada.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}