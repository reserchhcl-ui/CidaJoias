"use client";

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/src/lib/api/apiClient';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter(); // Importante
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('username', email);
      formData.append('password', password);

      const { data } = await api.post('/token', formData);
      
      // Decodificação simulada (Em produção use jwt-decode)
      // Estamos assumindo que o login retorna a role ou decodificamos do token
      // Para este exemplo, vou simular a verificação baseada no email ou resposta
      const mockRole = email.includes("admin") ? "admin" : "customer"; 
      
      const userData = { email, role: mockRole }; 
      login(data.access_token, userData);

      // Roteamento Inteligente
      if (mockRole === 'admin') {
        router.push('/admin');
      } else {
        router.push('/');
      }
      
    } catch (err) {
      setError('Credenciais inválidas.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-sm border border-slate-200">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-serif font-bold text-slate-900">Bem-vindo de volta</h1>
          <p className="text-slate-500 text-sm mt-2">Acesse sua conta para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded">{error}</div>}
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input 
              type="email" 
              required
              className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-amber-100 outline-none"
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

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-slate-900 text-white py-3 rounded-lg font-bold hover:bg-amber-600 transition-colors flex justify-center"
          >
            {loading ? <Loader2 className="animate-spin" /> : 'Entrar'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-600">
          Não tem uma conta?{' '}
          <Link href="/auth/register" className="text-amber-600 font-bold hover:underline">
            Cadastre-se
          </Link>
        </div>
      </div>
    </div>
  );
}