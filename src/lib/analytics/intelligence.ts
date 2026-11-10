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

export interface IntelligenceResult {
  positions: PositionLifecycle[];
  tradingStats: TradingStats;
  feeAndTaxStats: FeeAndTaxStats;
  trueExposure: TrueExposureStats;
  wealthProjection: WealthProjectionStats;
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

  return {
    positions,
    tradingStats,
    feeAndTaxStats,
    trueExposure,
    wealthProjection,
    lastUpdated: new Date().toISOString(),
  };
}

