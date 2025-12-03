"use client";

import { useState, useEffect } from 'react';
import api, { CheckoutService } from '@/src/lib/api/apiClient';
import { Address } from '@/src/lib/types';
import { Plus, Trash2, MapPin, Loader2 } from 'lucide-react';
import Header from '@/components/Header'; // Reutilizando Header

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  // Estado do Formulário
  const [newAddress, setNewAddress] = useState({
    name: '',
    recipient_name: '',
    zip_code: '',
    street: '',
    number: '',
    city: '',
    state: '',
    is_default: false
  });

  const fetchAddresses = async () => {
    setLoading(true);
    try {
      const data = await CheckoutService.getAddresses();
      setAddresses(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // POST para endpoint do backend
      await api.post('/addresses/', newAddress);
      setShowForm(false);
      fetchAddresses(); // Recarrega lista
      // Limpa form
      setNewAddress({ name: '', recipient_name: '', zip_code: '', street: '', number: '', city: '', state: '', is_default: false });
    } catch (e) {
      alert("Erro ao criar endereço");
    }
  };

  const handleDelete = async (id: number) => {
    if(!confirm("Tem certeza?")) return;
    try {
      await api.delete(`/addresses/${id}`);
      fetchAddresses();
    } catch (e) {
      alert("Erro ao deletar");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      <main className="container mx-auto px-4 py-24 max-w-4xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-serif font-bold text-slate-900">Meus Endereços</h1>
          <button 
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-amber-600 transition-colors"
          >
            <Plus className="w-4 h-4" /> Novo Endereço
          </button>
        </div>

        {/* Formulário de Novo Endereço */}
        {showForm && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8 animate-in fade-in slide-in-from-top-5">
            <h3 className="font-bold text-lg mb-4">Adicionar Endereço</h3>
            <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input placeholder="Apelido (ex: Casa)" className="border p-2 rounded" value={newAddress.name} onChange={e => setNewAddress({...newAddress, name: e.target.value})} required />
              <input placeholder="Destinatário" className="border p-2 rounded" value={newAddress.recipient_name} onChange={e => setNewAddress({...newAddress, recipient_name: e.target.value})} required />
              <input placeholder="CEP" className="border p-2 rounded" value={newAddress.zip_code} onChange={e => setNewAddress({...newAddress, zip_code: e.target.value})} required />
              <input placeholder="Rua" className="border p-2 rounded" value={newAddress.street} onChange={e => setNewAddress({...newAddress, street: e.target.value})} required />
              <input placeholder="Número" className="border p-2 rounded" value={newAddress.number} onChange={e => setNewAddress({...newAddress, number: e.target.value})} required />
              <div className="flex gap-2">
                <input placeholder="Cidade" className="border p-2 rounded w-2/3" value={newAddress.city} onChange={e => setNewAddress({...newAddress, city: e.target.value})} required />
                <input placeholder="UF" className="border p-2 rounded w-1/3" value={newAddress.state} onChange={e => setNewAddress({...newAddress, state: e.target.value})} required />
              </div>
              <div className="md:col-span-2 flex justify-end gap-2">
                <button type="button" onClick={() => setShowForm(false)} className="text-slate-500 hover:text-slate-700">Cancelar</button>
                <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700">Salvar</button>
              </div>
            </form>
          </div>
        )}

        {/* Lista de Endereços */}
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {addresses.map((addr) => (
              <div key={addr.id} className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm relative group">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-full ${addr.is_default ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500'}`}>
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">{addr.name} {addr.is_default && <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full ml-2">Padrão</span>}</h4>
                    <p className="text-sm text-slate-600 mt-1">{addr.street}, {addr.number}</p>
                    <p className="text-sm text-slate-600">{addr.city} - {addr.state}</p>
                    <p className="text-sm text-slate-400">{addr.zip_code}</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleDelete(addr.id)}
                  className="absolute top-4 right-4 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
            
            {addresses.length === 0 && !loading && (
              <div className="md:col-span-2 text-center py-10 text-slate-500 bg-white rounded-lg border border-dashed border-slate-300">
                Você ainda não tem endereços cadastrados.
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}