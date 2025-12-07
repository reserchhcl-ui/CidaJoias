import { redirect } from 'next/navigation';

export default function AccountPage() {
  // Redireciona automaticamente para a primeira aba da sidebar
  redirect('/account/profile');
}