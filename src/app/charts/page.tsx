import { MainLayout } from '@/components/layout';
import { ChartsPage } from '@/components/charts';

export default function ChartsPageRoute() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">גרפים</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">ביצועי תיק והשוואה למדדים</p>
        </div>

        <ChartsPage />
      </div>
    </MainLayout>
  );
}
