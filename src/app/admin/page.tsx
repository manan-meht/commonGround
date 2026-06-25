import { redirect } from 'next/navigation'
import { isAdminAuthenticated } from '@/lib/auth/adminSession'
import { AdminLoginForm } from './AdminLoginForm'

export default async function AdminPage() {
  const authed = await isAdminAuthenticated()
  if (authed) redirect('/admin/cases')
  return <AdminLoginForm />
}
