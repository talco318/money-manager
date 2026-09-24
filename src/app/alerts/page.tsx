import { MainLayout } from '@/components/layout';
import { AlertsList } from '@/components/alerts';

export default function AlertsPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">התראות</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">ניהול התראות על מחירי מניות</p>
        </div>

        <AlertsList />
      </div>
    </MainLayout>
  );
}
