import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import Sidebar from '@/components/layout/sidebar';
import AuthSessionProvider from '@/components/layout/session-provider';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  return (
    <AuthSessionProvider>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="ml-[260px] flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </AuthSessionProvider>
  );
}
