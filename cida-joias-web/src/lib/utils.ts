import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(value: number | string): string {
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(numericValue);
}

export function getImageUrl(path?: string | null): string {
  if (!path) return '/placeholder-jewelry.jpg'; // Coloque uma imagem padrão em public/
  if (path.startsWith('http')) return path;

  // Remove /api/v1 da URL base para pegar a raiz (ex: http://localhost:8000)
  const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:8000';
  
  // Garante que o path comece com /
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  return `${baseUrl}${cleanPath}`;
}