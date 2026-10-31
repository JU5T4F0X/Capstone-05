import { redirect } from 'next/navigation';

export default function AdminProfilPage() {
  redirect('/admin/dashboard?tab=profil');
}

