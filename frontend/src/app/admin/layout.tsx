
import AdminLayout from '@/layouts/AdminLayout';
import { NotificationProvider } from '@/contexts/NotificationContext';

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  // Use the centralized AdminLayout to avoid duplicate sidebars/layout issues.
  return (
    <NotificationProvider>
      <AdminLayout>{children}</AdminLayout>
    </NotificationProvider>
  );
}
