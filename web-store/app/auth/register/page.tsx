"use client";

import { useState } from 'react';
import api from '@/src/lib/api/apiClient';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.post('/users/register', {
        email,
        password,
        role: "customer"
      });
      
      // Redireciona para login após sucesso
      router.push('/auth/login?registered=true');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erro ao criar conta.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-sm border border-slate-200">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-serif font-bold text-slate-900">Criar Conta</h1>
          <p className="text-slate-500 text-sm mt-2">Junte-se ao clube Cida Joias</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded">{error}</div>}
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input 
              type="email" 
              required
              className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-amber-500 outline-none"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Senha</label>
            <input 
              type="password" 
              required
              className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-amber-500 outline-none"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Confirmar Senha</label>
            <input 
              type="password" 
              required
              className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-amber-500 outline-none"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-slate-900 text-white py-3 rounded-lg font-bold hover:bg-amber-600 transition-colors flex justify-center"
          >
            {loading ? <Loader2 className="animate-spin" /> : 'Cadastrar'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-600">
          Já tem uma conta?{' '}
          <Link href="/auth/login" className="text-amber-600 font-bold hover:underline">
            Entrar
          </Link>
        </div>
      </div>
    </div>
  );
}