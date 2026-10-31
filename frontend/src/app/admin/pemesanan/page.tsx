import { redirect } from 'next/navigation';

export default function AdminPemesananPage() {
  redirect('/admin/dashboard?tab=pemesanan');
}

