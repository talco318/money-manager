import { MainLayout } from '@/components/layout';
import { TransactionsList } from '@/components/transactions';

export default function TransactionsPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">עסקאות</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">היסטוריית כל העסקאות בתיק</p>
          </div>
          <div className="flex gap-3">
            <a 
              href="/import?tab=manual"
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              הוסף עסקה
            </a>
            <a 
              href="/import"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              ייבוא מאקסל
            </a>
          </div>
        </div>

        <TransactionsList />
      </div>
    </MainLayout>
  );
}
