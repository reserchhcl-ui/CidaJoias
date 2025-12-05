'use client';

import { ProductForm } from '@/components/admin/ProductForm';

export default function NewProductPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Novo Produto</h1>
        <p className="text-muted-foreground">
          Preencha os dados abaixo para cadastrar um novo item no catálogo.
        </p>
      </div>

      <ProductForm />
    </div>
  );
}