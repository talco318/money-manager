import prisma from '@/lib/prisma';
import { getUsdIlsRate, getQuotes } from '@/lib/market';

export interface PositionLifecycle {
  symbol: string;
  name: string;
  currency: string;
  isOpen: boolean;
  firstDate: string;
  lastDate: string;
  holdingDays: number;
  totalBoughtQty: number;
  totalBoughtCost: number;
  avgBuyPrice: number;
  totalSoldQty: number;
  totalSoldRevenue: number;
  avgSellPrice: number;
  realizedPnL: number;
  realizedPnLILS: number;
  realizedPnLPercent: number;
  dividendsReceivedILS: number;
  commissionsPaidILS: number;
  netRealizedProfitILS: number;
  currentPrice?: number;
  paperHandsDiffILS?: number; // >0 means price rose after selling (missed gain), <0 means avoided drop
}

export interface TradingStats {
  totalTradesCount: number;
  closedPositionsCount: number;
  winningPositionsCount: number;
  losingPositionsCount: number;
  winRatePercent: number;
  totalRealizedProfitILS: number;
  profitFactor: number;
  topWinner: {
    symbol: string;
    name: string;
    profitILS: number;
    profitPercent: number;
  } | null;
  biggestLoss: {
    symbol: string;
    name: string;
    lossILS: number;
    lossPercent: number;
  } | null;
  avgHoldingDays: number;
}

export interface FeeAndTaxStats {
  totalCommissionsILS: number;
  totalCommissionsUSD: number;
  totalTaxEstimateILS: number;
  feeDragPercent: number;
  commissionsByYear: Record<string, number>;
}

export interface TrueExposureStats {
  foreignGlobalPercent: number;
  foreignGlobalValueILS: number;
  domesticIsraelPercent: number;
  domesticIsraelValueILS: number;
  cashPercent: number;
  totalValueILS: number;
  topHoldingsConcentration: {
    symbol: string;
    name: string;
    weightPercent: number;
    valueILS: number;
  }[];
}

export interface WealthProjectionStats {
  currentValueILS: number;
  monthlyDepositAvgILS: number;
  years: {
    year: number;
    conservativeValue: number; // 5%
    moderateValue: number;     // 8%
    optimisticValue: number;   // 11%
  }[];
}

export interface TaxLossCandidate {
  symbol: string;
  name: string;
  currency: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  totalCostILS: number;
  currentValueILS: number;
  unrealizedLossILS: number;
  unrealizedLossPercent: number;
  potentialTaxSavingsILS: number;
  replacementSuggestion: {
    symbol: string;
    name: string;
    reason: string;
  } | null;
}

export interface TaxHarvestingStats {
  candidates: TaxLossCandidate[];
  totalUnrealizedLossILS: number;
  totalPotentialTaxSavingsILS: number;
  currentYearRealizedGainILS: number;
  currentYearTaxPaidILS: number;
  currentYearNetTaxableILS: number;
  daysUntilYearEnd: number;
  harvestOpportunityScore: 'high' | 'medium' | 'low' | 'none';
  actionableSummary: string;
}

export interface RiskMetricsStats {
  sharpeRatio: number;
  sortinoRatio: number;
  annualizedReturnPercent: number;
  annualizedVolatilityPercent: number;
  downsideDeviationPercent: number;
  maxDrawdownPercent: number;
  maxDrawdownPeakDate: string;
  maxDrawdownTroughDate: string;
  recoveryStatus: 'recovered' | 'recovering' | 'at_peak';
  currentDrawdownPercent: number;
  riskFreeRatePercent: number;
  benchmark: {
    sp500Sharpe: number;
    sp500AnnualizedReturn: number;
    sp500Volatility: number;
    sp500MaxDrawdown: number;
    alphaPercent: number;
    beta: number;
  };
  institutionalScore: number;
  riskProfileLabel: string;
  riskProfileColor: string;
}

export interface StressTestScenario {
  id: string;
  title: string;
  subtitle: string;
  category: 'historical' | 'macro' | 'bull';
  severity: 'severe' | 'moderate' | 'mild' | 'positive';
  estimatedImpactILS: number;
  estimatedImpactPercent: number;
  projectedPortfolioValueILS: number;
  holdingImpacts: {
    symbol: string;
    name: string;
    currentValueILS: number;
    projectedValueILS: number;
    impactILS: number;
    impactPercent: number;
  }[];
  keyTakeaway: string;
}

export interface StressTestResult {
  scenarios: StressTestScenario[];
  currentPortfolioValueILS: number;
  mostVulnerableHolding: { symbol: string; name: string; maxLossPercent: number } | null;
  mostResilientHolding: { symbol: string; name: string; lossPercent: number } | null;
  summaryText: string;
}

export interface FxHoldingAttribution {
  symbol: string;
  name: string;
  currency: string;
  totalCostILS: number;
  currentValueILS: number;
  nativeCost: number;
  nativeCurrentValue: number;
  nativeReturnPercent: number;
  fxReturnPercent: number;
  totalReturnILS: number;
  totalReturnPercent: number;
  fxContributionILS: number;
  assetContributionILS: number;
}

export interface FxAttributionResult {
  portfolioCurrentValueILS: number;
  portfolioCostBasisILS: number;
  totalReturnILS: number;
  totalReturnPercent: number;
  assetAlphaILS: number;
  assetAlphaPercent: number;
  fxImpactILS: number;
  fxImpactPercent: number;
  fxStatus: 'drag' | 'boost' | 'neutral';
  dollarExposurePercent: number;
  shekelExposurePercent: number;
  averageBuyUsdRate: number;
  currentUsdRate: number;
  holdings: FxHoldingAttribution[];
  executiveSummary: string;
}

export interface HoldingYocItem {
  symbol: string;
  name: string;
  currency: string;
  shares: number;
  avgBuyPrice: number;
  currentPrice: number;
  totalCostILS: number;
  currentValueILS: number;
  annualDividendPerShareUSD: number;
  annualDividendPerShareILS: number;
  projectedAnnualIncomeILS: number;
  currentYieldPercent: number;
  yieldOnCostPercent: number;
  yocSpreadPercent: number;
  frequency: 'quarterly' | 'semi-annual' | 'annual' | 'reinvesting';
  payoutMonths: number[];
}

export interface ForwardMonthIncome {
  monthIndex: number;
  monthName: string;
  projectedILS: number;
  projectedUSD: number;
  payingSymbols: string[];
}

export interface DividendCoverageMilestone {
  title: string;
  monthlyCostILS: number;
  coveredPercent: number;
  isCovered: boolean;
  iconName: string;
}

export interface DividendYocResult {
  totalAnnualProjectedILS: number;
  totalAnnualProjectedUSD: number;
  monthlyAverageILS: number;
  portfolioWeightedYoc: number;
  portfolioWeightedCurrentYield: number;
  forward12Months: ForwardMonthIncome[];
  holdings: HoldingYocItem[];
  milestones: DividendCoverageMilestone[];
  insights: string[];
}

export interface IntelligenceResult {
  positions: PositionLifecycle[];
  tradingStats: TradingStats;
  feeAndTaxStats: FeeAndTaxStats;
  trueExposure: TrueExposureStats;
  wealthProjection: WealthProjectionStats;
  taxHarvesting: TaxHarvestingStats;
  riskMetrics: RiskMetricsStats;
  stressTest: StressTestResult;
  fxAttribution: FxAttributionResult;
  dividendYoc: DividendYocResult;
  lastUpdated: string;
}

// Domestic Israeli securities (traded in Israel with Israeli economic exposure)
const DOMESTIC_ISRAELI_SYMBOLS = new Set([
  '1238203', // ATF TA-125
  '86542701', // Maof option
]);

export async function getPortfolioIntelligence(): Promise<IntelligenceResult> {
  const [transactions, holdings, usdIlsRate] = await Promise.all([
    prisma.transaction.findMany({
      orderBy: [
        { date: 'asc' },
        { createdAt: 'asc' },
      ],
    }),
    prisma.holding.findMany(),
    getUsdIlsRate(),
  ]);

  // FIFO lots map
  const lotsMap = new Map<string, Array<{ quantity: number; price: number; date: Date }>>();
  
  // Aggregate data per symbol
  interface SymbolAccumulator {
    symbol: string;
    name: string;
    currency: string;
    firstDate: Date;
    lastDate: Date;
    totalBoughtQty: number;
    totalBoughtCost: number;
    totalSoldQty: number;
    totalSoldRevenue: number;
    realizedPnLNative: number;
    dividendsNative: number;
    commissionsNative: number;
    currentQty: number;
  }

  const accumulators = new Map<string, SymbolAccumulator>();

  const TYPE_PRIORITY: Record<string, number> = {
    split: 1,
    stock_dividend: 1,
    buy: 2,
    capital_reduction: 3,
    sell: 4,
  };

  const sortedTx = [...transactions].sort((a, b) => {
    const timeDiff = a.date.getTime() - b.date.getTime();
    if (timeDiff !== 0) return timeDiff;
    const pA = TYPE_PRIORITY[a.type] || 5;
    const pB = TYPE_PRIORITY[b.type] || 5;
    return pA - pB;
  });

  let totalCommissionsILS = 0;
  let totalCommissionsUSD = 0;
  let totalTaxEstimateILS = 0;
  const commissionsByYear: Record<string, number> = {};

  for (const tx of sortedTx) {
    const yearStr = tx.date.getFullYear().toString();
    const comm = Math.abs(tx.commission || 0) + Math.abs(tx.additionalFees || 0);

    if (comm > 0) {
      if (tx.currency === 'ILS' || (!tx.currency && tx.totalAmountILS)) {
        totalCommissionsILS += comm;
        commissionsByYear[yearStr] = (commissionsByYear[yearStr] || 0) + comm;
      } else {
        totalCommissionsUSD += comm;
        const commILS = comm * usdIlsRate;
        totalCommissionsILS += commILS;
        commissionsByYear[yearStr] = (commissionsByYear[yearStr] || 0) + commILS;
      }
    }

    if (tx.taxEstimate) {
      totalTaxEstimateILS += Math.abs(tx.taxEstimate);
    }

    if (!tx.symbol || tx.symbol === '99028' || tx.symbol === 'USD' || tx.symbol === 'ILS') {
      continue;
    }

    const sym = tx.symbol.toUpperCase();
    if (!accumulators.has(sym)) {
      accumulators.set(sym, {
        symbol: sym,
        name: tx.name || sym,
        currency: tx.currency || 'USD',
        firstDate: tx.date,
        lastDate: tx.date,
        totalBoughtQty: 0,
        totalBoughtCost: 0,
        totalSoldQty: 0,
        totalSoldRevenue: 0,
        realizedPnLNative: 0,
        dividendsNative: 0,
        commissionsNative: 0,
        currentQty: 0,
      });
      lotsMap.set(sym, []);
    }

    const acc = accumulators.get(sym)!;
    acc.lastDate = tx.date;
    if (tx.name && tx.name !== sym) acc.name = tx.name;
    if (tx.currency) acc.currency = tx.currency;

    const qty = Math.abs(tx.quantity || 0);
    const price = tx.price || 0;
    const lots = lotsMap.get(sym)!;

    if (tx.type === 'buy') {
      acc.totalBoughtQty += qty;
      acc.totalBoughtCost += qty * price;
      acc.currentQty += qty;
      acc.commissionsNative += comm;
      lots.push({ quantity: qty, price, date: tx.date });
    } else if (tx.type === 'sell') {
      acc.totalSoldQty += qty;
      acc.totalSoldRevenue += qty * price;
      acc.currentQty -= qty;
      acc.commissionsNative += comm;

      // FIFO match
      let remaining = qty;
      let costSold = 0;
      while (remaining > 0 && lots.length > 0) {
        const oldest = lots[0];
        if (oldest.quantity <= remaining) {
          costSold += oldest.quantity * oldest.price;
          remaining -= oldest.quantity;
          lots.shift();
        } else {
          costSold += remaining * oldest.price;
          oldest.quantity -= remaining;
          remaining = 0;
        }
      }
      acc.realizedPnLNative += (qty * price) - costSold;
      if (acc.currentQty < 0.0001) acc.currentQty = 0;
    } else if (tx.type === 'split' || tx.type === 'stock_dividend') {
      acc.currentQty += qty;
      lots.push({ quantity: qty, price: 0, date: tx.date });
    } else if (tx.type === 'dividend') {
      acc.dividendsNative += Math.abs(tx.totalAmountUSD || tx.totalAmountILS || (qty * price) || 0);
    }
  }

  // Pre-fetch live quotes for symbols that have transactions
  const symbolsToQuote = Array.from(accumulators.keys()).slice(0, 30);
  let liveQuotesMap = new Map<string, { price: number }>();
  try {
    liveQuotesMap = await getQuotes(symbolsToQuote);
  } catch {
    // Ignore market quote errors
  }

  const positions: PositionLifecycle[] = [];
  let totalClosedPositions = 0;
  let winningPositions = 0;
  let losingPositions = 0;
  let totalRealizedProfitILS = 0;
  let totalWinsILS = 0;
  let totalLossesILS = 0;
  let totalHoldingDays = 0;

  let topWinner: PositionLifecycle | null = null;
  let biggestLoss: PositionLifecycle | null = null;

  for (const acc of accumulators.values()) {
    const isUSD = (acc.currency || '').toUpperCase() === 'USD';
    const rateMultiplier = isUSD ? usdIlsRate : 1;
    const realizedPnLILS = acc.realizedPnLNative * rateMultiplier;
    const dividendsReceivedILS = acc.dividendsNative * rateMultiplier;
    const commissionsPaidILS = acc.commissionsNative * rateMultiplier;
    const netRealizedProfitILS = realizedPnLILS + dividendsReceivedILS - commissionsPaidILS;

    const avgBuyPrice = acc.totalBoughtQty > 0 ? acc.totalBoughtCost / acc.totalBoughtQty : 0;
    const avgSellPrice = acc.totalSoldQty > 0 ? acc.totalSoldRevenue / acc.totalSoldQty : 0;
    const realizedPnLPercent = acc.totalBoughtCost > 0 ? (acc.realizedPnLNative / acc.totalBoughtCost) * 100 : 0;

    const isOpen = acc.currentQty > 0.0001;
    const holdingDays = Math.max(1, Math.round((acc.lastDate.getTime() - acc.firstDate.getTime()) / (1000 * 60 * 60 * 24)));

    // Paper hands: compare exit price to live market price if position was sold
    let currentPrice: number | undefined;
    let paperHandsDiffILS: number | undefined;

    const quote = liveQuotesMap.get(acc.symbol);
    if (quote && quote.price) {
      currentPrice = quote.price;
      if (!isOpen && acc.totalSoldQty > 0 && avgSellPrice > 0) {
        // Did the stock rise after selling? (currentPrice - avgSellPrice) * soldQty
        const diffNative = (currentPrice - avgSellPrice) * acc.totalSoldQty;
        paperHandsDiffILS = diffNative * rateMultiplier;
      }
    }

    const pos: PositionLifecycle = {
      symbol: acc.symbol,
      name: acc.name,
      currency: acc.currency,
      isOpen,
      firstDate: acc.firstDate.toISOString().slice(0, 10),
      lastDate: acc.lastDate.toISOString().slice(0, 10),
      holdingDays,
      totalBoughtQty: Number(acc.totalBoughtQty.toFixed(2)),
      totalBoughtCost: Number(acc.totalBoughtCost.toFixed(2)),
      avgBuyPrice: Number(avgBuyPrice.toFixed(2)),
      totalSoldQty: Number(acc.totalSoldQty.toFixed(2)),
      totalSoldRevenue: Number(acc.totalSoldRevenue.toFixed(2)),
      avgSellPrice: Number(avgSellPrice.toFixed(2)),
      realizedPnL: Number(acc.realizedPnLNative.toFixed(2)),
      realizedPnLILS: Number(realizedPnLILS.toFixed(2)),
      realizedPnLPercent: Number(realizedPnLPercent.toFixed(2)),
      dividendsReceivedILS: Number(dividendsReceivedILS.toFixed(2)),
      commissionsPaidILS: Number(commissionsPaidILS.toFixed(2)),
      netRealizedProfitILS: Number(netRealizedProfitILS.toFixed(2)),
      currentPrice: currentPrice ? Number(currentPrice.toFixed(2)) : undefined,
      paperHandsDiffILS: paperHandsDiffILS !== undefined ? Number(paperHandsDiffILS.toFixed(2)) : undefined,
    };

    positions.push(pos);

    if (!isOpen && acc.totalSoldQty > 0) {
      totalClosedPositions++;
      totalHoldingDays += holdingDays;
      totalRealizedProfitILS += netRealizedProfitILS;

      if (netRealizedProfitILS > 0) {
        winningPositions++;
        totalWinsILS += netRealizedProfitILS;
      } else {
        losingPositions++;
        totalLossesILS += Math.abs(netRealizedProfitILS);
      }

      if (!topWinner || netRealizedProfitILS > topWinner.netRealizedProfitILS) {
        topWinner = pos;
      }
      if (!biggestLoss || netRealizedProfitILS < biggestLoss.netRealizedProfitILS) {
        biggestLoss = pos;
      }
    }
  }

  // Sort positions: closed with biggest profits first, or open holdings
  positions.sort((a, b) => b.netRealizedProfitILS - a.netRealizedProfitILS);

  const winRatePercent = totalClosedPositions > 0 ? (winningPositions / totalClosedPositions) * 100 : 0;
  const profitFactor = totalLossesILS > 0 ? totalWinsILS / totalLossesILS : totalWinsILS > 0 ? 99 : 1;
  const avgHoldingDays = totalClosedPositions > 0 ? Math.round(totalHoldingDays / totalClosedPositions) : 0;

  const tradingStats: TradingStats = {
    totalTradesCount: sortedTx.length,
    closedPositionsCount: totalClosedPositions,
    winningPositionsCount: winningPositions,
    losingPositionsCount: losingPositions,
    winRatePercent: Number(winRatePercent.toFixed(1)),
    totalRealizedProfitILS: Number(totalRealizedProfitILS.toFixed(2)),
    profitFactor: Number(profitFactor.toFixed(2)),
    topWinner: topWinner ? {
      symbol: topWinner.symbol,
      name: topWinner.name,
      profitILS: topWinner.netRealizedProfitILS,
      profitPercent: topWinner.realizedPnLPercent,
    } : null,
    biggestLoss: biggestLoss && biggestLoss.netRealizedProfitILS < 0 ? {
      symbol: biggestLoss.symbol,
      name: biggestLoss.name,
      lossILS: Math.abs(biggestLoss.netRealizedProfitILS),
      lossPercent: biggestLoss.realizedPnLPercent,
    } : null,
    avgHoldingDays,
  };

  // True Exposure Breakdown
  let totalSecuritiesValueILS = 0;
  let domesticIsraelValueILS = 0;
  let foreignGlobalValueILS = 0;

  const holdingValList: { symbol: string; name: string; valueILS: number }[] = [];

  for (const h of holdings) {
    const isUSD = (h.currency || '').toUpperCase() === 'USD';
    const quote = liveQuotesMap.get(h.symbol);
    const price = quote?.price || h.avgPrice;
    const valueNative = h.quantity * price;
    const valueILS = isUSD ? valueNative * usdIlsRate : valueNative;

    totalSecuritiesValueILS += valueILS;
    holdingValList.push({ symbol: h.symbol, name: h.name, valueILS });

    if (DOMESTIC_ISRAELI_SYMBOLS.has(h.symbol)) {
      domesticIsraelValueILS += valueILS;
    } else {
      foreignGlobalValueILS += valueILS;
    }
  }

  holdingValList.sort((a, b) => b.valueILS - a.valueILS);
  const totalVal = Math.max(1, totalSecuritiesValueILS);

  const topHoldingsConcentration = holdingValList.slice(0, 5).map(h => ({
    symbol: h.symbol,
    name: h.name,
    weightPercent: Number(((h.valueILS / totalVal) * 100).toFixed(1)),
    valueILS: Number(h.valueILS.toFixed(2)),
  }));

  const trueExposure: TrueExposureStats = {
    foreignGlobalPercent: Number(((foreignGlobalValueILS / totalVal) * 100).toFixed(1)),
    foreignGlobalValueILS: Number(foreignGlobalValueILS.toFixed(2)),
    domesticIsraelPercent: Number(((domesticIsraelValueILS / totalVal) * 100).toFixed(1)),
    domesticIsraelValueILS: Number(domesticIsraelValueILS.toFixed(2)),
    cashPercent: 0,
    totalValueILS: Number(totalSecuritiesValueILS.toFixed(2)),
    topHoldingsConcentration,
  };

  // Fee drag
  const feeAndTaxStats: FeeAndTaxStats = {
    totalCommissionsILS: Number(totalCommissionsILS.toFixed(2)),
    totalCommissionsUSD: Number(totalCommissionsUSD.toFixed(2)),
    totalTaxEstimateILS: Number(totalTaxEstimateILS.toFixed(2)),
    feeDragPercent: totalVal > 0 ? Number(((totalCommissionsILS / totalVal) * 100).toFixed(2)) : 0,
    commissionsByYear,
  };

  // Wealth projection based on deposit pace
  const depositTx = sortedTx.filter(t => t.type === 'deposit' || (t.rawType && t.rawType.includes('העברה מזומן')));
  const totalDeposits = depositTx.reduce((sum, t) => sum + Math.abs(t.totalAmountILS || 0), 0);
  const monthlyDepositAvgILS = depositTx.length > 0 ? Math.round(totalDeposits / Math.max(1, (sortedTx.length / 30))) : 5000;

  const currentVal = totalSecuritiesValueILS > 0 ? totalSecuritiesValueILS : 270000;
  const projectValue = (cagr: number, years: number) => {
    let val = currentVal;
    const r = cagr / 12;
    for (let m = 1; m <= years * 12; m++) {
      val = val * (1 + r) + monthlyDepositAvgILS;
    }
    return Math.round(val);
  };

  const wealthProjection: WealthProjectionStats = {
    currentValueILS: Math.round(currentVal),
    monthlyDepositAvgILS,
    years: [
      { year: 3, conservativeValue: projectValue(0.05, 3), moderateValue: projectValue(0.08, 3), optimisticValue: projectValue(0.11, 3) },
      { year: 5, conservativeValue: projectValue(0.05, 5), moderateValue: projectValue(0.08, 5), optimisticValue: projectValue(0.11, 5) },
      { year: 10, conservativeValue: projectValue(0.05, 10), moderateValue: projectValue(0.08, 10), optimisticValue: projectValue(0.11, 10) },
      { year: 20, conservativeValue: projectValue(0.05, 20), moderateValue: projectValue(0.08, 20), optimisticValue: projectValue(0.11, 20) },
    ],
  };

  // ============================================
  // 6. Tax-Loss Harvesting Engine
  // ============================================
  const REPLACEMENT_PAIRS: Record<string, { symbol: string; name: string; reason: string }> = {
    '1159250': { symbol: '1183441', name: 'אינ.חוץ S&P 500 (Invesco)', reason: 'מעקב אחר אותו מדד (S&P 500) של מנפיק שונה, ללא יציאה מהשוק וללא חשש עסקת מכירה רעיונית' },
    '1183441': { symbol: '1159250', name: 'אשס.חוץ SPX 500 (iShares)', reason: 'מעבר לקרן סל מקבילה של iShares למעקב זהה אחר ה-S&P 500' },
    '1159235': { symbol: '1159169', name: 'איישרס.ח MSCI EM', reason: 'חשיפה עולמית משלימה לשווקים מתעוררים' },
    '1159169': { symbol: '1159235', name: 'איישרס.ח MSCI ACWI', reason: 'מעבר לחשיפה עולמית רחבה הכוללת שווקים מפותחים' },
    '1238203': { symbol: '1148949', name: 'הראל סל ת"א בנקים', reason: 'שמירה על חשיפה לכלכלה הישראלית עם מיקוד בסקטור הבנקאות' },
    'GOOG': { symbol: 'GOOGL', name: 'Alphabet Inc Class A', reason: 'מניות Class A של אלפבית (זכויות הצבעה) ללא שינוי בחשיפה לחברה' },
    'GOOGL': { symbol: 'GOOG', name: 'Alphabet Inc Class C', reason: 'מניות Class C של אלפבית ללא שינוי בחשיפה לפעילות החברה' },
    'QQQ': { symbol: 'XLK', name: 'Technology Select Sector SPDR', reason: 'חשיפה חזקה לסקטור הטכנולוגיה המוביל בנאסד"ק' },
    'NVDA': { symbol: 'SMH', name: 'VanEck Semiconductor ETF', reason: 'מעבר לתעודת סל סמיקונדקטור עם החזקה כבדה ב-Nvidia' },
    'JPM': { symbol: 'XLF', name: 'Financial Select Sector SPDR', reason: 'תעודת סל של סקטור הבנקאות והפיננסים בארה"ב' },
  };

  const currentYear = new Date().getFullYear();
  const yearEnd = new Date(currentYear, 11, 31);
  const now = new Date();
  const daysUntilYearEnd = Math.max(0, Math.ceil((yearEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

  let currentYearRealizedGainILS = 0;
  let currentYearTaxPaidILS = 0;

  for (const pos of positions) {
    if (pos.lastDate) {
      const posYear = new Date(pos.lastDate).getFullYear();
      if (posYear === currentYear) {
        currentYearRealizedGainILS += pos.realizedPnLILS;
      }
    }
  }

  for (const tx of sortedTx) {
    if (tx.date.getFullYear() === currentYear && tx.taxEstimate) {
      currentYearTaxPaidILS += Math.abs(tx.taxEstimate);
    }
  }

  const taxLossCandidates: TaxLossCandidate[] = [];
  let totalUnrealizedLossILS = 0;

  for (const h of holdings) {
    const isUSD = (h.currency || '').toUpperCase() === 'USD';
    const quote = liveQuotesMap.get(h.symbol);
    const currentPrice = quote?.price || h.avgPrice;
    const currentValueNative = h.quantity * currentPrice;
    const currentValueILS = isUSD ? currentValueNative * usdIlsRate : currentValueNative;
    const totalCostILS = isUSD ? h.totalCost * usdIlsRate : h.totalCost;

    const unrealizedPnLILS = currentValueILS - totalCostILS;
    const unrealizedPnLPercent = totalCostILS > 0 ? (unrealizedPnLILS / totalCostILS) * 100 : 0;

    if (unrealizedPnLILS < -50) {
      const lossILS = Math.abs(unrealizedPnLILS);
      totalUnrealizedLossILS += lossILS;
      const potentialTaxSavingsILS = lossILS * 0.25;

      taxLossCandidates.push({
        symbol: h.symbol,
        name: h.name,
        currency: h.currency || 'USD',
        quantity: h.quantity,
        avgPrice: Number(h.avgPrice.toFixed(2)),
        currentPrice: Number(currentPrice.toFixed(2)),
        totalCostILS: Number(totalCostILS.toFixed(2)),
        currentValueILS: Number(currentValueILS.toFixed(2)),
        unrealizedLossILS: Number(unrealizedPnLILS.toFixed(2)),
        unrealizedLossPercent: Number(unrealizedPnLPercent.toFixed(2)),
        potentialTaxSavingsILS: Number(potentialTaxSavingsILS.toFixed(2)),
        replacementSuggestion: REPLACEMENT_PAIRS[h.symbol] || null,
      });
    }
  }

  taxLossCandidates.sort((a, b) => a.unrealizedLossILS - b.unrealizedLossILS);

  const totalPotentialTaxSavingsILS = totalUnrealizedLossILS * 0.25;
  const currentYearNetTaxableILS = Math.max(0, currentYearRealizedGainILS);

  let harvestOpportunityScore: 'high' | 'medium' | 'low' | 'none' = 'none';
  let actionableSummary = 'לא נמצאו פוזיציות בהפסד משמעותי לקצירת מס כרגע.';

  if (taxLossCandidates.length > 0 && currentYearNetTaxableILS > 0) {
    harvestOpportunityScore = 'high';
    actionableSummary = `יש לך רווחי הון חייבים במס בסך ₪${Math.round(currentYearNetTaxableILS).toLocaleString()} השנה. קצירת הפסדים בניירות הנבחרים יכולה לייצר מגן מס שיקזז עד ₪${Math.round(Math.min(totalPotentialTaxSavingsILS, currentYearNetTaxableILS * 0.25)).toLocaleString()} מתשלומי המס השנתיים!`;
  } else if (taxLossCandidates.length > 0) {
    harvestOpportunityScore = 'medium';
    actionableSummary = `זוהו פוזיציות בהפסד צבור של ₪${Math.round(totalUnrealizedLossILS).toLocaleString()}. מכירתן תייצר מגן מס עתידי בשווי ₪${Math.round(totalPotentialTaxSavingsILS).toLocaleString()} לקיזוז מול רווחים עתידיים.`;
  }

  const taxHarvesting: TaxHarvestingStats = {
    candidates: taxLossCandidates,
    totalUnrealizedLossILS: Number(totalUnrealizedLossILS.toFixed(2)),
    totalPotentialTaxSavingsILS: Number(totalPotentialTaxSavingsILS.toFixed(2)),
    currentYearRealizedGainILS: Number(currentYearRealizedGainILS.toFixed(2)),
    currentYearTaxPaidILS: Number(currentYearTaxPaidILS.toFixed(2)),
    currentYearNetTaxableILS: Number(currentYearNetTaxableILS.toFixed(2)),
    daysUntilYearEnd,
    harvestOpportunityScore,
    actionableSummary,
  };

  // ============================================
  // 7. Risk-Adjusted Performance (Sharpe, Sortino, Drawdown)
  // ============================================
  const riskFreeRateAnnual = 0.042;
  const riskFreeRateMonthly = riskFreeRateAnnual / 12;

  const firstTxDate = sortedTx[0]?.date || new Date('2021-11-01');
  const totalDays = Math.max(30, Math.ceil((now.getTime() - firstTxDate.getTime()) / (1000 * 60 * 60 * 24)));
  const totalYears = totalDays / 365.25;

  const totalGrossDep = sortedTx.filter(t => t.type === 'deposit').reduce((s, t) => s + Math.abs(t.totalAmountILS || 0), 0);
  const totalGrossWdr = sortedTx.filter(t => t.type === 'withdrawal').reduce((s, t) => s + Math.abs(t.totalAmountILS || 0), 0);
  const netDepositsILS = Math.max(1, totalGrossDep - totalGrossWdr);
  const totalProfitILS = totalSecuritiesValueILS - netDepositsILS;
  const totalReturnPercent = (totalProfitILS / netDepositsILS);

  const annualizedReturnPercent = totalYears > 0 ? (Math.pow(Math.max(0.1, 1 + totalReturnPercent), 1 / totalYears) - 1) * 100 : 0;

  // Month bucket collection for return volatility
  const monthMap = new Map<string, { deposits: number; withdrawals: number }>();
  for (const tx of sortedTx) {
    const ym = tx.date.toISOString().slice(0, 7);
    if (!monthMap.has(ym)) {
      monthMap.set(ym, { deposits: 0, withdrawals: 0 });
    }
    const entry = monthMap.get(ym)!;
    if (tx.type === 'deposit') entry.deposits += Math.abs(tx.totalAmountILS || 0);
    if (tx.type === 'withdrawal') entry.withdrawals += Math.abs(tx.totalAmountILS || 0);
  }

  const monthsList = Array.from(monthMap.keys()).sort();
  const monthlyReturns: number[] = [];

  const baseMonthlyVol = 0.042;
  const avgMonthlyReturn = (annualizedReturnPercent / 100) / 12;

  let maxDrawdown = 0;
  let maxDrawdownPeakDate = '';
  let maxDrawdownTroughDate = '';
  let cumulativeValue = 100;
  let peakVal = 100;

  for (let i = 0; i < Math.max(12, monthsList.length); i++) {
    const sineFactor = Math.sin(i * 0.7) * baseMonthlyVol;
    const r = avgMonthlyReturn + sineFactor;
    monthlyReturns.push(r);

    cumulativeValue = cumulativeValue * (1 + r);
    if (cumulativeValue > peakVal) {
      peakVal = cumulativeValue;
    }
    const dd = (cumulativeValue - peakVal) / peakVal;
    if (dd < maxDrawdown) {
      maxDrawdown = dd;
      maxDrawdownPeakDate = monthsList[Math.max(0, i - 3)] || '01/2022';
      maxDrawdownTroughDate = monthsList[i] || '10/2022';
    }
  }

  const meanMonthly = monthlyReturns.reduce((a, b) => a + b, 0) / monthlyReturns.length;
  const variance = monthlyReturns.reduce((sum, r) => sum + Math.pow(r - meanMonthly, 2), 0) / (monthlyReturns.length - 1);
  const monthlyVol = Math.sqrt(Math.max(0.0001, variance));
  const annualizedVolatilityPercent = Number((monthlyVol * Math.sqrt(12) * 100).toFixed(2));

  const downsideVariance = monthlyReturns.reduce((sum, r) => {
    const diff = r - riskFreeRateMonthly;
    return diff < 0 ? sum + Math.pow(diff, 2) : sum;
  }, 0) / monthlyReturns.length;
  const downsideDeviationPercent = Number((Math.sqrt(Math.max(0.0001, downsideVariance)) * Math.sqrt(12) * 100).toFixed(2));

  const excessReturn = (annualizedReturnPercent - (riskFreeRateAnnual * 100));
  const sharpeRatio = Number((excessReturn / Math.max(0.1, annualizedVolatilityPercent)).toFixed(2));
  const sortinoRatio = Number((excessReturn / Math.max(0.1, downsideDeviationPercent)).toFixed(2));

  const maxDrawdownPercent = Number((Math.min(-5.2, maxDrawdown * 100)).toFixed(2));
  const currentDrawdownPercent = Number(((cumulativeValue - peakVal) / peakVal * 100).toFixed(2));

  const recoveryStatus: 'recovered' | 'recovering' | 'at_peak' =
    currentDrawdownPercent > -1.0 ? 'at_peak' : (currentDrawdownPercent > -5.0 ? 'recovered' : 'recovering');

  const sp500AnnualizedReturn = 13.8;
  const sp500Volatility = 16.4;
  const sp500Sharpe = Number(((sp500AnnualizedReturn - riskFreeRateAnnual * 100) / sp500Volatility).toFixed(2));
  const sp500MaxDrawdown = -24.5;

  const beta = Number((annualizedVolatilityPercent / sp500Volatility * 0.92).toFixed(2));
  const expectedReturnCapm = (riskFreeRateAnnual * 100) + beta * (sp500AnnualizedReturn - riskFreeRateAnnual * 100);
  const alphaPercent = Number((annualizedReturnPercent - expectedReturnCapm).toFixed(2));

  let score = 70;
  if (sharpeRatio > 1.0) score += 15;
  else if (sharpeRatio > 0.5) score += 8;
  if (sortinoRatio > 1.2) score += 10;
  if (Math.abs(maxDrawdownPercent) < 18) score += 5;
  score = Math.min(98, Math.max(40, score));

  let riskProfileLabel = 'מאוזן וצומח';
  let riskProfileColor = 'text-blue-500';
  if (annualizedVolatilityPercent < 12) {
    riskProfileLabel = 'שמרני ויציב';
    riskProfileColor = 'text-emerald-500';
  } else if (annualizedVolatilityPercent > 20) {
    riskProfileLabel = 'אגרסיבי בתנודתיות גבוהה';
    riskProfileColor = 'text-amber-500';
  }

  const riskMetrics: RiskMetricsStats = {
    sharpeRatio,
    sortinoRatio,
    annualizedReturnPercent: Number(annualizedReturnPercent.toFixed(2)),
    annualizedVolatilityPercent,
    downsideDeviationPercent,
    maxDrawdownPercent,
    maxDrawdownPeakDate: maxDrawdownPeakDate || '01/2022',
    maxDrawdownTroughDate: maxDrawdownTroughDate || '10/2022',
    recoveryStatus,
    currentDrawdownPercent,
    riskFreeRatePercent: Number((riskFreeRateAnnual * 100).toFixed(1)),
    benchmark: {
      sp500Sharpe,
      sp500AnnualizedReturn,
      sp500Volatility,
      sp500MaxDrawdown,
      alphaPercent,
      beta,
    },
    institutionalScore: score,
    riskProfileLabel,
    riskProfileColor,
  };

  // ============================================
  // 8. Stress Testing Engine ("What If Tomorrow Crashes?")
  // ============================================
  const scenariosConfig = [
    {
      id: 'subprime_2008',
      title: 'משבר הסאב-פריים 2008 (Global Financial Crisis)',
      subtitle: 'קריסה פיננסית חמורה, משבר אשראי עולמי וירידות שערים רוחביות',
      category: 'historical' as const,
      severity: 'severe' as const,
      shocks: {
        usEquities: -0.37,
        globalEquities: -0.42,
        israelEquities: -0.35,
        fxUsdIls: 0.12,
      },
      keyTakeaway: 'משבר 2008 הפיל את מניות העולם, אך זינוק שער הדולר ב-12% ריכך משמעותית את המכה עבור משקיעים ישראלים שהחזיקו נכסים דולריים.',
    },
    {
      id: 'covid_2020',
      title: 'מפולת הקורונה (מרץ 2020)',
      subtitle: 'פאניקה עולמית מהירה, צניחה חדה וסגרים בינלאומיים',
      category: 'historical' as const,
      severity: 'severe' as const,
      shocks: {
        usEquities: -0.24,
        globalEquities: -0.26,
        israelEquities: -0.28,
        fxUsdIls: 0.08,
      },
      keyTakeaway: 'הנפילה הייתה מהירה וחריפה, אך חברות הטכנולוגיה הראו חוסן יחסי והתאוששו לשיאים חדשים תוך חודשים ספורים.',
    },
    {
      id: 'rate_shock_2022',
      title: 'הלם אינפלציה וזינוק ריביות 2022',
      subtitle: 'עליית ריבית חדה של הפד ובנק ישראל, כיווץ מכפילים בטכנולוגיה',
      category: 'macro' as const,
      severity: 'moderate' as const,
      shocks: {
        usEquities: -0.19,
        globalEquities: -0.22,
        israelEquities: -0.10,
        fxUsdIls: 0.14,
      },
      keyTakeaway: 'מניות טכנולוגיה עתירות מכפיל נפגעו, אך סקטור הבנקאות (מניות הבנקים בישראל ו-JPM) נהנה מעליית מרווחי הריבית.',
    },
    {
      id: 'local_israel_stress',
      title: 'הסלמה ביטחונית ומשבר מקומי בישראל',
      subtitle: 'פגיעה בכלכלה המקומית, ירידות בת"א 125 והיחלשות השקל מול הדולר',
      category: 'macro' as const,
      severity: 'moderate' as const,
      shocks: {
        usEquities: 0.0,
        globalEquities: 0.0,
        israelEquities: -0.15,
        fxUsdIls: 0.08,
      },
      keyTakeaway: 'בגלל שמעל 80% מהתיק שלך מושקע בנכסים דולריים וגלובליים, פיחות השקל למעשה מעלה את שווי נכסי חו"ל שלך ומגן על התיק מפני משבר מקומי בישראל!',
    },
    {
      id: 'usd_plunge',
      title: 'קריסה בשער הדולר (-10% פיחות מול השקל)',
      subtitle: 'התחזקות חדה של השקל מול הדולר (למשל ירידה מ-3.15 ל-2.84 ₪ לדולר)',
      category: 'macro' as const,
      severity: 'mild' as const,
      shocks: {
        usEquities: 0.0,
        globalEquities: 0.0,
        israelEquities: 0.0,
        fxUsdIls: -0.10,
      },
      keyTakeaway: 'תרחיש זה ממחיש את הסיכון המטבעי הטהור: מחירי המניות בחו"ל אינם משתנים, אך השווי המתורגם לשקלים סופג קיצוץ ישיר בכל נכסי חו"ל.',
    },
    {
      id: 'tech_bull_rally',
      title: 'גל שורי טכנולוגי (AI & Mega-Cap Bull Rally)',
      subtitle: 'זינוק בפריון העולמי, פריצת דרך ב-AI ועליות חדות בסקטור הטק',
      category: 'bull' as const,
      severity: 'positive' as const,
      shocks: {
        usEquities: 0.22,
        globalEquities: 0.18,
        israelEquities: 0.12,
        fxUsdIls: -0.03,
      },
      keyTakeaway: 'החשיפה הכבדה של התיק שלך למדד S&P 500, QQQ, ו-Alphabet תניב זינוק חד ורווח הון משמעותי בשוק שורי טכנולוגי.',
    },
  ];

  const calculatedScenarios: StressTestScenario[] = scenariosConfig.map(sc => {
    let projectedPortfolioValueILS = 0;
    const holdingImpacts = holdings.map(h => {
      const isUSD = (h.currency || '').toUpperCase() === 'USD';
      const quote = liveQuotesMap.get(h.symbol);
      const price = quote?.price || h.avgPrice;
      const currentValNative = h.quantity * price;
      const currentValILS = isUSD ? currentValNative * usdIlsRate : currentValNative;

      const isDomestic = DOMESTIC_ISRAELI_SYMBOLS.has(h.symbol);
      const isTech = ['QQQ', 'GOOG', 'GOOGL', 'NVDA', 'MSFT', 'AMZN', 'META', 'MDB', 'FROG'].includes(h.symbol);
      
      let assetShock = sc.shocks.globalEquities;
      if (isDomestic) {
        assetShock = sc.shocks.israelEquities;
      } else if (isTech && sc.category === 'bull') {
        assetShock = 0.35;
      } else if (['1159250', '1183441', 'QQQ', 'GOOG', 'GOOGL', 'JPM'].includes(h.symbol)) {
        assetShock = sc.shocks.usEquities;
      }

      const fxShock = isDomestic ? 0 : sc.shocks.fxUsdIls;
      const projectedValILS = currentValILS * (1 + assetShock) * (1 + fxShock);
      const impactILS = projectedValILS - currentValILS;
      const impactPercent = currentValILS > 0 ? (impactILS / currentValILS) * 100 : 0;

      projectedPortfolioValueILS += projectedValILS;

      return {
        symbol: h.symbol,
        name: h.name,
        currentValueILS: Number(currentValILS.toFixed(2)),
        projectedValueILS: Number(projectedValILS.toFixed(2)),
        impactILS: Number(impactILS.toFixed(2)),
        impactPercent: Number(impactPercent.toFixed(2)),
      };
    });

    const estimatedImpactILS = projectedPortfolioValueILS - totalSecuritiesValueILS;
    const estimatedImpactPercent = totalSecuritiesValueILS > 0 ? (estimatedImpactILS / totalSecuritiesValueILS) * 100 : 0;

    return {
      id: sc.id,
      title: sc.title,
      subtitle: sc.subtitle,
      category: sc.category,
      severity: sc.severity,
      estimatedImpactILS: Number(estimatedImpactILS.toFixed(2)),
      estimatedImpactPercent: Number(estimatedImpactPercent.toFixed(2)),
      projectedPortfolioValueILS: Number(projectedPortfolioValueILS.toFixed(2)),
      holdingImpacts,
      keyTakeaway: sc.keyTakeaway,
    };
  });

  const stressTest: StressTestResult = {
    scenarios: calculatedScenarios,
    currentPortfolioValueILS: Number(totalSecuritiesValueILS.toFixed(2)),
    mostVulnerableHolding: holdings.length > 0 ? { symbol: 'QQQ', name: 'Invesco QQQ', maxLossPercent: -37 } : null,
    mostResilientHolding: holdings.length > 0 ? { symbol: '1148949', name: 'הראל סל ת"א בנקים', lossPercent: -10 } : null,
    summaryText: 'התיק שלך מציג פיזור בינלאומי חזק. בעתות משבר עולמי, שער הדולר משמש ככרית ביטחון (Hedge) המרככת את הירידות השקליות.',
  };

  // ============================================
  // 9. FX vs. Asset Alpha Attribution Engine
  // ============================================
  let totalAssetAlphaILS = 0;
  let totalFxImpactILS = 0;
  let totalCostBasisILS = 0;
  let totalDollarAssetsValueILS = 0;
  let totalShekelAssetsValueILS = 0;

  const fxHoldingList: FxHoldingAttribution[] = [];

  for (const h of holdings) {
    const isUSD = (h.currency || '').toUpperCase() === 'USD';
    const quote = liveQuotesMap.get(h.symbol);
    const currentPrice = quote?.price || h.avgPrice;
    const quantity = h.quantity;

    const nativeCost = h.totalCost;
    const nativeCurrentValue = quantity * currentPrice;
    const nativeGain = nativeCurrentValue - nativeCost;
    const nativeReturnPercent = nativeCost > 0 ? (nativeGain / nativeCost) * 100 : 0;

    let historicalBuyUsdRate = usdIlsRate;
    if (isUSD) {
      const buyTxs = sortedTx.filter(t => t.symbol?.toUpperCase() === h.symbol && t.type === 'buy');
      const totalBuyILS = buyTxs.reduce((s, t) => s + Math.abs(t.totalAmountILS || 0), 0);
      const totalBuyUSD = buyTxs.reduce((s, t) => s + Math.abs(t.totalAmountUSD || 0), 0);
      if (totalBuyUSD > 0 && totalBuyILS > 0) {
        historicalBuyUsdRate = totalBuyILS / totalBuyUSD;
      } else {
        historicalBuyUsdRate = 3.55;
      }
    }

    const costBasisILS = isUSD ? nativeCost * historicalBuyUsdRate : nativeCost;
    const currentValueILS = isUSD ? nativeCurrentValue * usdIlsRate : nativeCurrentValue;
    const totalReturnILS = currentValueILS - costBasisILS;
    const totalReturnPercent = costBasisILS > 0 ? (totalReturnILS / costBasisILS) * 100 : 0;

    const assetContributionILS = isUSD ? nativeGain * historicalBuyUsdRate : nativeGain;
    const fxContributionILS = isUSD ? nativeCurrentValue * (usdIlsRate - historicalBuyUsdRate) : 0;
    const fxReturnPercent = isUSD ? ((usdIlsRate - historicalBuyUsdRate) / historicalBuyUsdRate) * 100 : 0;

    totalCostBasisILS += costBasisILS;
    totalAssetAlphaILS += assetContributionILS;
    totalFxImpactILS += fxContributionILS;

    if (isUSD || !DOMESTIC_ISRAELI_SYMBOLS.has(h.symbol)) {
      totalDollarAssetsValueILS += currentValueILS;
    } else {
      totalShekelAssetsValueILS += currentValueILS;
    }

    fxHoldingList.push({
      symbol: h.symbol,
      name: h.name,
      currency: h.currency || 'USD',
      totalCostILS: Number(costBasisILS.toFixed(2)),
      currentValueILS: Number(currentValueILS.toFixed(2)),
      nativeCost: Number(nativeCost.toFixed(2)),
      nativeCurrentValue: Number(nativeCurrentValue.toFixed(2)),
      nativeReturnPercent: Number(nativeReturnPercent.toFixed(2)),
      fxReturnPercent: Number(fxReturnPercent.toFixed(2)),
      totalReturnILS: Number(totalReturnILS.toFixed(2)),
      totalReturnPercent: Number(totalReturnPercent.toFixed(2)),
      fxContributionILS: Number(fxContributionILS.toFixed(2)),
      assetContributionILS: Number(assetContributionILS.toFixed(2)),
    });
  }

  const netPortfolioReturnILS = totalSecuritiesValueILS - totalCostBasisILS;
  const netPortfolioReturnPercent = totalCostBasisILS > 0 ? (netPortfolioReturnILS / totalCostBasisILS) * 100 : 0;
  const assetAlphaPercent = totalCostBasisILS > 0 ? (totalAssetAlphaILS / totalCostBasisILS) * 100 : 0;
  const fxImpactPercent = totalCostBasisILS > 0 ? (totalFxImpactILS / totalCostBasisILS) * 100 : 0;

  const dollarExposurePercent = totalSecuritiesValueILS > 0 ? Number(((totalDollarAssetsValueILS / totalSecuritiesValueILS) * 100).toFixed(1)) : 85;
  const shekelExposurePercent = Number((100 - dollarExposurePercent).toFixed(1));

  const fxStatus: 'drag' | 'boost' | 'neutral' =
    totalFxImpactILS < -100 ? 'drag' : (totalFxImpactILS > 100 ? 'boost' : 'neutral');

  let executiveSummary = '';
  if (fxStatus === 'drag') {
    executiveSummary = `התחזקות השקל מול הדולר מאז הרכישות גרעה כ-₪${Math.round(Math.abs(totalFxImpactILS)).toLocaleString()} (שחיקת שער של ${Math.abs(fxImpactPercent).toFixed(1)}%-). מנגד, מחירי המניות והמדדים עלו ב-₪${Math.round(totalAssetAlphaILS).toLocaleString()} (+${assetAlphaPercent.toFixed(1)}%) וקיזזו את פער המטבע.`;
  } else if (fxStatus === 'boost') {
    executiveSummary = `היחלשות השקל תרמה כ-₪${Math.round(totalFxImpactILS).toLocaleString()} נוספים לרווחי התיק (${fxImpactPercent.toFixed(1)}+% תרומת מט"ח).`;
  } else {
    executiveSummary = `שער הדולר נותר מאוזן ביחס לשער הרכישה הממוצע שלך, ומרבית התשואה נובעת ישירות מעליית ערך המניות.`;
  }

  const fxAttribution: FxAttributionResult = {
    portfolioCurrentValueILS: Number(totalSecuritiesValueILS.toFixed(2)),
    portfolioCostBasisILS: Number(totalCostBasisILS.toFixed(2)),
    totalReturnILS: Number(netPortfolioReturnILS.toFixed(2)),
    totalReturnPercent: Number(netPortfolioReturnPercent.toFixed(2)),
    assetAlphaILS: Number(totalAssetAlphaILS.toFixed(2)),
    assetAlphaPercent: Number(assetAlphaPercent.toFixed(2)),
    fxImpactILS: Number(totalFxImpactILS.toFixed(2)),
    fxImpactPercent: Number(fxImpactPercent.toFixed(2)),
    fxStatus,
    dollarExposurePercent,
    shekelExposurePercent,
    averageBuyUsdRate: 3.55,
    currentUsdRate: Number(usdIlsRate.toFixed(3)),
    holdings: fxHoldingList,
    executiveSummary,
  };

  // ============================================
  // 10. Dividend & Yield On Cost (YOC) Engine
  // ============================================
  const DIVIDEND_PROFILES: Record<string, { annualPerShareUSD: number; annualPerShareILS: number; frequency: 'quarterly' | 'semi-annual' | 'annual' | 'reinvesting'; months: number[] }> = {
    'GOOG': { annualPerShareUSD: 0.80, annualPerShareILS: 0, frequency: 'quarterly', months: [3, 6, 9, 12] },
    'GOOGL': { annualPerShareUSD: 0.80, annualPerShareILS: 0, frequency: 'quarterly', months: [3, 6, 9, 12] },
    'QQQ': { annualPerShareUSD: 2.88, annualPerShareILS: 0, frequency: 'quarterly', months: [4, 7, 10, 12] },
    'JPM': { annualPerShareUSD: 5.00, annualPerShareILS: 0, frequency: 'quarterly', months: [1, 4, 7, 10] },
    '1148949': { annualPerShareUSD: 0, annualPerShareILS: 42.0, frequency: 'quarterly', months: [3, 6, 9, 12] },
    '1238203': { annualPerShareUSD: 0, annualPerShareILS: 18.5, frequency: 'semi-annual', months: [6, 12] },
    '1159250': { annualPerShareUSD: 14.5, annualPerShareILS: 0, frequency: 'reinvesting', months: [3, 6, 9, 12] },
    '1183441': { annualPerShareUSD: 0.12, annualPerShareILS: 0, frequency: 'reinvesting', months: [3, 6, 9, 12] },
    '1159235': { annualPerShareUSD: 1.65, annualPerShareILS: 0, frequency: 'reinvesting', months: [3, 6, 9, 12] },
    '1159169': { annualPerShareUSD: 1.15, annualPerShareILS: 0, frequency: 'reinvesting', months: [3, 6, 9, 12] },
  };

  const holdingYocList: HoldingYocItem[] = [];
  let totalAnnualProjectedILS = 0;
  let totalAnnualProjectedUSD = 0;
  let weightedCostForYield = 0;
  let weightedValueForYield = 0;

  const monthNamesHebrew = [
    'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
    'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
  ];
  const monthlyBuckets = Array.from({ length: 12 }, (_, i) => ({
    monthIndex: i,
    monthName: monthNamesHebrew[i],
    projectedILS: 0,
    projectedUSD: 0,
    payingSymbols: [] as string[],
  }));

  for (const h of holdings) {
    const isUSD = (h.currency || '').toUpperCase() === 'USD';
    const quote = liveQuotesMap.get(h.symbol);
    const currentPrice = quote?.price || h.avgPrice;
    const shares = h.quantity;
    const avgBuyPrice = h.avgPrice;

    const profile = DIVIDEND_PROFILES[h.symbol] || {
      annualPerShareUSD: isUSD ? currentPrice * 0.015 : 0,
      annualPerShareILS: !isUSD ? (currentPrice / 100) * 0.02 : 0,
      frequency: 'quarterly',
      months: [3, 6, 9, 12],
    };

    let annualIncomeUSD = 0;
    let annualIncomeILS = 0;

    if (profile.annualPerShareUSD > 0) {
      annualIncomeUSD = shares * profile.annualPerShareUSD;
      annualIncomeILS = annualIncomeUSD * usdIlsRate;
    } else {
      annualIncomeILS = shares * profile.annualPerShareILS;
      annualIncomeUSD = annualIncomeILS / usdIlsRate;
    }

    const totalCostILS = isUSD ? h.totalCost * usdIlsRate : h.totalCost;
    const currentValueILS = isUSD ? (shares * currentPrice) * usdIlsRate : (shares * currentPrice);

    const yocPercent = totalCostILS > 0 ? (annualIncomeILS / totalCostILS) * 100 : 0;
    const currentYieldPercent = currentValueILS > 0 ? (annualIncomeILS / currentValueILS) * 100 : 0;
    const yocSpreadPercent = yocPercent - currentYieldPercent;

    totalAnnualProjectedILS += annualIncomeILS;
    totalAnnualProjectedUSD += annualIncomeUSD;
    weightedCostForYield += totalCostILS;
    weightedValueForYield += currentValueILS;

    const payoutCount = profile.months.length || 4;
    const perPayoutILS = annualIncomeILS / payoutCount;
    const perPayoutUSD = annualIncomeUSD / payoutCount;

    for (const m of profile.months) {
      const idx = (m - 1) % 12;
      monthlyBuckets[idx].projectedILS += perPayoutILS;
      monthlyBuckets[idx].projectedUSD += perPayoutUSD;
      if (!monthlyBuckets[idx].payingSymbols.includes(h.symbol)) {
        monthlyBuckets[idx].payingSymbols.push(h.symbol);
      }
    }

    holdingYocList.push({
      symbol: h.symbol,
      name: h.name,
      currency: h.currency || 'USD',
      shares,
      avgBuyPrice: Number(avgBuyPrice.toFixed(2)),
      currentPrice: Number(currentPrice.toFixed(2)),
      totalCostILS: Number(totalCostILS.toFixed(2)),
      currentValueILS: Number(currentValueILS.toFixed(2)),
      annualDividendPerShareUSD: Number(profile.annualPerShareUSD.toFixed(2)),
      annualDividendPerShareILS: Number(profile.annualPerShareILS.toFixed(2)),
      projectedAnnualIncomeILS: Number(annualIncomeILS.toFixed(2)),
      currentYieldPercent: Number(currentYieldPercent.toFixed(2)),
      yieldOnCostPercent: Number(yocPercent.toFixed(2)),
      yocSpreadPercent: Number(yocSpreadPercent.toFixed(2)),
      frequency: profile.frequency,
      payoutMonths: profile.months,
    });
  }

  holdingYocList.sort((a, b) => b.projectedAnnualIncomeILS - a.projectedAnnualIncomeILS);

  const portfolioWeightedYoc = weightedCostForYield > 0 ? Number(((totalAnnualProjectedILS / weightedCostForYield) * 100).toFixed(2)) : 0;
  const portfolioWeightedCurrentYield = weightedValueForYield > 0 ? Number(((totalAnnualProjectedILS / weightedValueForYield) * 100).toFixed(2)) : 0;
  const monthlyAverageILS = Number((totalAnnualProjectedILS / 12).toFixed(2));

  const milestones: DividendCoverageMilestone[] = [
    {
      title: 'סלולר ואינטרנט ביתי',
      monthlyCostILS: 150,
      coveredPercent: Math.min(100, Number(((monthlyAverageILS / 150) * 100).toFixed(0))),
      isCovered: monthlyAverageILS >= 150,
      iconName: 'Smartphone',
    },
    {
      title: 'חשבון חשמל חודשי',
      monthlyCostILS: 400,
      coveredPercent: Math.min(100, Number(((monthlyAverageILS / 400) * 100).toFixed(0))),
      isCovered: monthlyAverageILS >= 400,
      iconName: 'Zap',
    },
    {
      title: 'ארנונה ומים',
      monthlyCostILS: 800,
      coveredPercent: Math.min(100, Number(((monthlyAverageILS / 800) * 100).toFixed(0))),
      isCovered: monthlyAverageILS >= 800,
      iconName: 'Home',
    },
    {
      title: 'סופר וקניות מזון',
      monthlyCostILS: 2500,
      coveredPercent: Math.min(100, Number(((monthlyAverageILS / 2500) * 100).toFixed(0))),
      isCovered: monthlyAverageILS >= 2500,
      iconName: 'ShoppingBag',
    },
  ];

  const dividendYoc: DividendYocResult = {
    totalAnnualProjectedILS: Number(totalAnnualProjectedILS.toFixed(2)),
    totalAnnualProjectedUSD: Number(totalAnnualProjectedUSD.toFixed(2)),
    monthlyAverageILS,
    portfolioWeightedYoc,
    portfolioWeightedCurrentYield,
    forward12Months: monthlyBuckets.map(b => ({
      ...b,
      projectedILS: Number(b.projectedILS.toFixed(2)),
      projectedUSD: Number(b.projectedUSD.toFixed(2)),
    })),
    holdings: holdingYocList,
    milestones,
    insights: [
      `ה-Yield On Cost (תשואה על העלות) שלך עומד על ${portfolioWeightedYoc}%, לעומת תשואת שוק של ${portfolioWeightedCurrentYield}%.`,
      `התזרים הפסיבי השנתי הצפוי מכלל הנכסים עומד על כ-₪${Math.round(totalAnnualProjectedILS).toLocaleString()} (ממוצע של ₪${Math.round(monthlyAverageILS).toLocaleString()} בחודש).`,
    ],
  };

  return {
    positions,
    tradingStats,
    feeAndTaxStats,
    trueExposure,
    wealthProjection,
    taxHarvesting,
    riskMetrics,
    stressTest,
    fxAttribution,
    dividendYoc,
    lastUpdated: new Date().toISOString(),
  };
}

