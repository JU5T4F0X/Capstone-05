import { redirect } from 'next/navigation';

export default function AdminVenuesPage() {
  redirect('/admin/dashboard?tab=venue');
}

