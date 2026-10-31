import { redirect } from 'next/navigation';

export default function AdminSkorPage() {
  redirect('/admin/dashboard?tab=skor');
}

