import { redirect } from 'next/navigation';

export default function AdminPembayaranPage() {
  redirect('/admin/dashboard?tab=pembayaran');
}

