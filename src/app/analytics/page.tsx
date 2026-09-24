import { MainLayout } from '@/components/layout';
import { AnalyticsPage } from '@/components/analytics';

export default function AnalyticsPageRoute() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">אנליטיקה</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">ניתוח דיבידנדים ועמלות</p>
        </div>

        <AnalyticsPage />
      </div>
    </MainLayout>
  );
}
