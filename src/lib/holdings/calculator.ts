import prisma from '@/lib/prisma';

interface HoldingData {
  symbol: string;
  name: string;
  quantity: number;
  avgPrice: number;
  totalCost: number;
  currency: string;
}

interface TransactionForCalculation {
  id: string;
  date: Date;
  type: string;
  symbol: string | null;
  name: string | null;
  quantity: number | null;
  price: number | null;
  currency: string;
}

/**
 * Calculate holdings from all transactions using FIFO method
 * Returns a map of symbol -> holding data
 */
export async function calculateHoldings(): Promise<Map<string, HoldingData>> {
  // Fetch all relevant transactions, ordered by date
  const transactions = await prisma.transaction.findMany({
    where: {
      type: { in: ['buy', 'sell', 'split', 'capital_reduction', 'stock_dividend'] },
      symbol: { not: null },
    },
    orderBy: [
      { date: 'asc' },
      { createdAt: 'asc' },
    ],
    select: {
      id: true,
      date: true,
      type: true,
      symbol: true,
      name: true,
      quantity: true,
      price: true,
      currency: true,
      createdAt: true,
    },
  });

  // Intra-day ordering: For transactions on the same date, always process buys/splits before sells.
  // This guarantees that day-trades (bought and sold same day) or options that were closed
  // have the required lots to sell from and cleanly resolve to 0 holdings.
  const TYPE_PRIORITY: Record<string, number> = {
    split: 1,
    stock_dividend: 1,
    buy: 2,
    capital_reduction: 3,
    sell: 4,
  };

  transactions.sort((a, b) => {
    const timeDiff = a.date.getTime() - b.date.getTime();
    if (timeDiff !== 0) return timeDiff;
    const pA = TYPE_PRIORITY[a.type] || 5;
    const pB = TYPE_PRIORITY[b.type] || 5;
    if (pA !== pB) return pA - pB;
    return a.createdAt.getTime() - b.createdAt.getTime();
  });

  // Group transactions by symbol
  const holdingsMap = new Map<string, HoldingData>();
  
  // FIFO lots for each symbol: array of { quantity, price }
  const lotsMap = new Map<string, Array<{ quantity: number; price: number }>>();

  for (const tx of transactions) {
    if (!tx.symbol || tx.quantity === null || tx.quantity === undefined) continue;

    const symbol = tx.symbol.toUpperCase();
    const quantity = Math.abs(tx.quantity);
    const price = tx.price || 0;

    // Initialize if needed
    if (!lotsMap.has(symbol)) {
      lotsMap.set(symbol, []);
    }
    if (!holdingsMap.has(symbol)) {
      holdingsMap.set(symbol, {
        symbol,
        name: tx.name || symbol,
        quantity: 0,
        avgPrice: 0,
        totalCost: 0,
        currency: tx.currency || 'USD',
      });
    }

    const lots = lotsMap.get(symbol)!;
    const holding = holdingsMap.get(symbol)!;

    if (tx.type === 'buy') {
      // Add a new lot
      lots.push({ quantity, price });
      
      // Update holding totals
      holding.quantity += quantity;
      holding.totalCost += quantity * price;
      holding.avgPrice = holding.quantity > 0 ? holding.totalCost / holding.quantity : 0;
      if (tx.currency) {
        holding.currency = tx.currency;
      }
      
      // Update name if we have a better one
      if (tx.name && tx.name !== symbol) {
        holding.name = tx.name;
      }
    } else if (tx.type === 'sell') {
      // FIFO: remove from oldest lots first
      let remainingToSell = quantity;
      let costBasisSold = 0;

      while (remainingToSell > 0 && lots.length > 0) {
        const oldestLot = lots[0];
        
        if (oldestLot.quantity <= remainingToSell) {
          // Sell entire lot
          costBasisSold += oldestLot.quantity * oldestLot.price;
          remainingToSell -= oldestLot.quantity;
          lots.shift(); // Remove the lot
        } else {
          // Partial sell from this lot
          costBasisSold += remainingToSell * oldestLot.price;
          oldestLot.quantity -= remainingToSell;
          remainingToSell = 0;
        }
      }

      // Update holding totals
      holding.quantity -= quantity;
      holding.totalCost -= costBasisSold;
      
      // Ensure non-negative values
      if (holding.quantity < 0.0001) {
        holding.quantity = 0;
        holding.totalCost = 0;
        holding.avgPrice = 0;
        lots.length = 0; // Clear any lot rounding residues
      } else {
        holding.totalCost = Math.max(0, holding.totalCost);
        holding.avgPrice = holding.totalCost / holding.quantity;
      }
    } else if (tx.type === 'split' || tx.type === 'stock_dividend') {
      // Stock split / bonus shares / dividend in shares
      // These ADD shares with $0 cost basis
      // The new shares are "free" so they reduce the average cost
      lots.push({ quantity, price: 0 });
      
      holding.quantity += quantity;
      // Total cost stays the same, but avg price decreases
      holding.avgPrice = holding.quantity > 0 ? holding.totalCost / holding.quantity : 0;
      
      console.log(`Split/Bonus: ${symbol} added ${quantity} shares, new total: ${holding.quantity}, new avg: ${holding.avgPrice.toFixed(2)}`);
      
      // Update name if we have a better one
      if (tx.name && tx.name !== symbol) {
        holding.name = tx.name;
      }
    } else if (tx.type === 'capital_reduction') {
      // Capital reduction removes shares without selling
      // This is like a reverse split or share cancellation
      let remainingToRemove = quantity;
      let costBasisRemoved = 0;

      while (remainingToRemove > 0 && lots.length > 0) {
        const oldestLot = lots[0];
        
        if (oldestLot.quantity <= remainingToRemove) {
          costBasisRemoved += oldestLot.quantity * oldestLot.price;
          remainingToRemove -= oldestLot.quantity;
          lots.shift();
        } else {
          costBasisRemoved += remainingToRemove * oldestLot.price;
          oldestLot.quantity -= remainingToRemove;
          remainingToRemove = 0;
        }
      }

      holding.quantity -= quantity;
      holding.totalCost -= costBasisRemoved;
      
      if (holding.quantity < 0.0001) {
        holding.quantity = 0;
        holding.totalCost = 0;
        holding.avgPrice = 0;
        lots.length = 0;
      } else {
        holding.totalCost = Math.max(0, holding.totalCost);
        holding.avgPrice = holding.totalCost / holding.quantity;
      }
      
      console.log(`Capital reduction: ${symbol} removed ${quantity} shares, new total: ${holding.quantity}`);
    }
  }

  // Filter out holdings with zero quantity
  const activeHoldings = new Map<string, HoldingData>();
  for (const [symbol, holding] of holdingsMap) {
    if (holding.quantity > 0.0001) {
      activeHoldings.set(symbol, holding);
    }
  }

  return activeHoldings;
}

/**
 * Automatically repair any legacy transactions that were imported with older buggy mapping
 * (e.g. Israeli ETFs mapped to US tickers VOO/SPY/ACWI/EEM, or prices divided by 3.6).
 */
export async function repairLegacyTransactions(): Promise<number> {
  try {
    const legacyTransactions = await prisma.transaction.findMany({
      where: {
        OR: [
          { symbol: { in: ['VOO', 'SPY', 'ACWI', 'EEM', 'TA125.TA', 'BKIR.TA'] } },
          { name: { contains: 'SPX 500' } },
          { name: { contains: 'S&P500' } },
          { name: { contains: 'MSCI' } },
          { name: { contains: 'ת"א 125' } },
          { name: { contains: 'בנק ישר' } },
        ],
      },
    });

    let repairedCount = 0;

    for (const tx of legacyTransactions) {
      let targetSymbol: string | null = null;
      let targetCurrency: string = tx.currency;
      const name = tx.name || '';
      const sym = tx.symbol || '';

      if (sym === 'VOO' || name.includes('SPX 500')) {
        targetSymbol = '1159250';
        targetCurrency = 'ILS';
      } else if (sym === 'SPY' || name.includes('אינ.חוץS&P500') || name.includes('אינ.חוץ S&P500')) {
        targetSymbol = '1183441';
        targetCurrency = 'ILS';
      } else if (sym === 'ACWI' || name.includes('MSCIACW') || name.includes('MS ACWI')) {
        targetSymbol = '1159235';
        targetCurrency = 'ILS';
      } else if (sym === 'EEM' || name.includes('MSCI EM')) {
        targetSymbol = '1159169';
        targetCurrency = 'ILS';
      } else if (sym === 'TA125.TA' || name.includes('ת"א 125')) {
        targetSymbol = '1238203';
        targetCurrency = 'ILS';
      } else if (sym === 'BKIR.TA' || name.includes('בנק ישר')) {
        targetSymbol = '1148949';
        targetCurrency = 'ILS';
      }

      if (targetSymbol) {
        let targetPrice = tx.price;
        // If price was divided by 3.6 during legacy import, restore real price from totalAmountILS / quantity
        if (tx.totalAmountILS && tx.quantity && tx.quantity > 0) {
          const truePrice = Math.abs(tx.totalAmountILS / tx.quantity);
          if (tx.price && Math.abs(tx.price * 3.6 - truePrice) < 5) {
            targetPrice = Math.round(truePrice * 100) / 100;
          }
        }

        await prisma.transaction.update({
          where: { id: tx.id },
          data: {
            symbol: targetSymbol,
            currency: targetCurrency,
            price: targetPrice,
          },
        });
        repairedCount++;
      }
    }

    if (repairedCount > 0) {
      console.log(`Repaired ${repairedCount} legacy transactions in database`);
    }
    return repairedCount;
  } catch (error) {
    console.error('Error during legacy transaction repair:', error);
    return 0;
  }
}

/**
 * Sync holdings table with calculated values
 * This updates the Holding table in the database
 */
export async function syncHoldings(): Promise<void> {
  // First auto-repair any corrupted/legacy transactions if present
  await repairLegacyTransactions();

  const calculatedHoldings = await calculateHoldings();

  // Get existing holdings from DB
  const existingHoldings = await prisma.holding.findMany();
  const existingSymbols = new Set(existingHoldings.map(h => h.symbol));

  // Upsert each calculated holding
  for (const [symbol, holding] of calculatedHoldings) {
    await prisma.holding.upsert({
      where: { symbol },
      create: {
        symbol: holding.symbol,
        name: holding.name,
        quantity: holding.quantity,
        avgPrice: holding.avgPrice,
        totalCost: holding.totalCost,
        currency: holding.currency,
      },
      update: {
        name: holding.name,
        quantity: holding.quantity,
        avgPrice: holding.avgPrice,
        totalCost: holding.totalCost,
        currency: holding.currency,
      },
    });
  }

  // Delete holdings that no longer exist (sold completely)
  const calculatedSymbols = new Set(calculatedHoldings.keys());
  for (const existing of existingHoldings) {
    if (!calculatedSymbols.has(existing.symbol)) {
      await prisma.holding.delete({
        where: { id: existing.id },
      });
    }
  }
}

/**
 * Get current cash balance from transactions
 */
export async function calculateCashBalance(): Promise<{ usd: number; ils: number }> {
  // Get the latest transaction with cash balance
  const latestWithBalance = await prisma.transaction.findFirst({
    where: {
      cashBalance: { not: null },
    },
    orderBy: { date: 'desc' },
    select: { cashBalance: true },
  });

  // Sum up USD transactions
  const usdTransactions = await prisma.transaction.aggregate({
    _sum: { totalAmountUSD: true },
  });

  return {
    usd: Math.max(0, usdTransactions._sum.totalAmountUSD || 0),
    ils: latestWithBalance?.cashBalance || 0,
  };
}

/**
 * Get portfolio summary statistics
 */
export async function getPortfolioStats() {
  const holdings = await prisma.holding.findMany();
  
  const totalCost = holdings.reduce((sum, h) => sum + h.totalCost, 0);
  const totalHoldings = holdings.length;
  
  // Get total commissions paid
  const commissions = await prisma.transaction.aggregate({
    _sum: { commission: true, additionalFees: true },
  });

  const totalCommissions = (commissions._sum.commission || 0) + (commissions._sum.additionalFees || 0);

  // Get total dividends received
  const dividends = await prisma.transaction.aggregate({
    where: { type: 'dividend' },
    _sum: { totalAmountUSD: true },
  });

  const totalDividends = Math.abs(dividends._sum.totalAmountUSD || 0);

  return {
    totalCost,
    totalHoldings,
    totalCommissions,
    totalDividends,
    holdings,
  };
}
