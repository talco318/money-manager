'use client';

import React, { useState } from 'react';
import { useAnalytics, useIntelligence } from '@/hooks';
import { Button } from '@/components/ui';
import { DividendAnalytics } from './DividendAnalytics';
import { CommissionAnalytics } from './CommissionAnalytics';
import { PositionsHistory } from './PositionsHistory';
import { TradingJournal } from './TradingJournal';
import { FrictionAnalytics } from './FrictionAnalytics';
import { RiskExposure } from './RiskExposure';
import { WealthSimulator } from './WealthSimulator';
import { TaxLossHarvesting } from './TaxLossHarvesting';
import { RiskAdjustedMetrics } from './RiskAdjustedMetrics';
import { StressTesting } from './StressTesting';
import { FxAttribution } from './FxAttribution';
import { DividendYocDashboard } from './DividendYocDashboard';
import {
  Trophy,
  Target,
  Globe,
  Receipt,
  Rocket,
  DollarSign,
  Scale,
  Activity,
  ShieldAlert,
  ArrowRightLeft,
  Coins,
  RefreshCw,
} from 'lucide-react';

type Tab =
  | 'tax-loss'
  | 'risk-metrics'
  | 'stress-test'
  | 'fx-attribution'
  | 'dividend-yoc'
  | 'positions'
  | 'journal'
  | 'exposure'
  | 'friction'
  | 'simulator'
  | 'dividends';

const tabs: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'tax-loss', label: 'קצירת הפסדים ומיטוב מס', icon: Scale },
  { id: 'risk-metrics', label: 'מדדי סיכון (Sharpe)', icon: Activity },
  { id: 'stress-test', label: 'סימולטור קיצון (Stress)', icon: ShieldAlert },
  { id: 'fx-attribution', label: 'פירוק תשואת מטבע (FX)', icon: ArrowRightLeft },
  { id: 'dividend-yoc', label: 'דיבידנדים ו-YOC', icon: Coins },
  { id: 'positions', label: 'מה החזקתי ומתי', icon: Trophy },
  { id: 'journal', label: 'יומן הצלחה ומסחר', icon: Target },
  { id: 'exposure', label: 'חשיפות וסיכון אמיתי', icon: Globe },
  { id: 'friction', label: 'שחיקת עמלות ומס', icon: Receipt },
  { id: 'simulator', label: 'סימולטור צמיחה', icon: Rocket },
  { id: 'dividends', label: 'היסטוריית דיבידנדים', icon: DollarSign },
];

export function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('tax-loss');
  const { dividends, isLoading: isAnalyticsLoading, refresh: refreshAnalytics } = useAnalytics();
  const { data: intelligence, isLoading: isIntelLoading, refresh: refreshIntel, error: intelError } = useIntelligence();

  const isLoading = isIntelLoading || isAnalyticsLoading;

  const handleRefresh = async () => {
    await Promise.all([refreshIntel(), refreshAnalytics()]);
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">
            מודיעין ותובנות פיננסיות
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            ניתוח עומק של ביצועים, מדדי סיכון Sharpe/Sortino, סימולציות קיצון, פירוק תשואת מט"ח ו-YOC
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isLoading}
          className="rounded-xl flex items-center gap-1.5 self-end sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'מרענן...' : 'רענן תובנות'}
        </Button>
      </div>

      {/* Scrollable Tabs Bar */}
      <div className="overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex gap-2 p-1.5 bg-gray-100 dark:bg-gray-800/80 rounded-2xl w-max sm:w-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-xs'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600 dark:text-blue-400' : ''}`} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Error Alert */}
      {intelError && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4">
          <p className="text-red-800 dark:text-red-200 text-xs font-semibold">{intelError}</p>
        </div>
      )}

      {/* Content Rendering */}
      {activeTab === 'tax-loss' && intelligence && (
        <TaxLossHarvesting stats={intelligence.taxHarvesting} />
      )}

      {activeTab === 'risk-metrics' && intelligence && (
        <RiskAdjustedMetrics stats={intelligence.riskMetrics} />
      )}

      {activeTab === 'stress-test' && intelligence && (
        <StressTesting stats={intelligence.stressTest} isLoading={isIntelLoading} />
      )}

      {activeTab === 'fx-attribution' && intelligence && (
        <FxAttribution stats={intelligence.fxAttribution} isLoading={isIntelLoading} />
      )}

      {activeTab === 'dividend-yoc' && intelligence && (
        <DividendYocDashboard stats={intelligence.dividendYoc} isLoading={isIntelLoading} />
      )}

      {activeTab === 'positions' && intelligence && (
        <PositionsHistory positions={intelligence.positions} isLoading={isIntelLoading} />
      )}

      {activeTab === 'journal' && intelligence && (
        <TradingJournal stats={intelligence.tradingStats} isLoading={isIntelLoading} />
      )}

      {activeTab === 'exposure' && intelligence && (
        <RiskExposure stats={intelligence.trueExposure} isLoading={isIntelLoading} />
      )}

      {activeTab === 'friction' && intelligence && (
        <FrictionAnalytics stats={intelligence.feeAndTaxStats} isLoading={isIntelLoading} />
      )}

      {activeTab === 'simulator' && intelligence && (
        <WealthSimulator stats={intelligence.wealthProjection} isLoading={isIntelLoading} />
      )}

      {activeTab === 'dividends' && (
        <DividendAnalytics data={dividends} isLoading={isAnalyticsLoading} />
      )}
    </div>
  );
}
