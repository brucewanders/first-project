import { Category, Transaction } from '../types';

export interface ParsedTransactionItem {
  title: string;
  amount: number;
  categoryId: string;
  emoji: string;
  type: 'expense' | 'income';
  paymentMethod: string;
  notes?: string;
}

/**
 * Parses free-form text or speech into structured transactions using Gemini 3.8 Flash (with local regex fallback)
 */
export async function parseNaturalLanguageTransactions(
  text: string,
  categories: Category[],
  currencyCode: string = 'UGX'
): Promise<ParsedTransactionItem[]> {
  try {
    const res = await fetch('/api/gemini/parse-transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, categories, currencyCode }),
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.items) && data.items.length > 0) {
        return data.items;
      }
    }
  } catch (err) {
    console.warn('API parse failed, using fallback parser:', err);
  }

  // Robust Client-side Fallback Parser
  return fallbackParseTransactions(text, categories);
}

function fallbackParseTransactions(text: string, categories: Category[]): ParsedTransactionItem[] {
  const items: ParsedTransactionItem[] = [];
  const lower = text.toLowerCase();

  // Split by "and", comma, or period
  const clauses = lower.split(/,|and|\+/i);

  clauses.forEach((clause) => {
    const trimmed = clause.trim();
    if (!trimmed) return;

    // Look for numbers like 2,000, 2000, 10k, 50000
    const numberMatch = trimmed.match(/(\d+(?:[,\.]\d+)?)\s*(?:k|thousand|ush|ugx|\$)?/i);
    if (!numberMatch) return;

    let amount = parseFloat(numberMatch[1].replace(/,/g, ''));
    if (trimmed.includes('k') && amount < 1000) {
      amount *= 1000;
    }

    if (isNaN(amount) || amount <= 0) return;

    // Determine category and title
    let categoryId = 'cat-other-expense';
    let emoji = '🏷️';
    let title = 'General Expense';
    let type: 'expense' | 'income' = 'expense';

    if (trimmed.includes('airtime') || trimmed.includes('data') || trimmed.includes('bundle') || trimmed.includes('phone') || trimmed.includes('minutes')) {
      categoryId = 'cat-airtime';
      emoji = '📱';
      title = 'Airtime & Internet';
    } else if (trimmed.includes('food') || trimmed.includes('snack') || trimmed.includes('lunch') || trimmed.includes('dinner') || trimmed.includes('burger') || trimmed.includes('grocer')) {
      categoryId = 'cat-food';
      emoji = '🍔';
      title = 'Food & Snacks';
    } else if (trimmed.includes('fuel') || trimmed.includes('commute') || trimmed.includes('boda') || trimmed.includes('matatu') || trimmed.includes('taxi') || trimmed.includes('uber')) {
      categoryId = 'cat-transport';
      emoji = '🚗';
      title = 'Commute & Fuel / Rideshare';
    } else if (trimmed.includes('electricity') || trimmed.includes('token') || trimmed.includes('yaka') || trimmed.includes('power') || trimmed.includes('water')) {
      categoryId = 'cat-utilities';
      emoji = '⚡';
      title = 'Electricity Prepaid Token';
    } else if (trimmed.includes('cinema') || trimmed.includes('movie') || trimmed.includes('netflix') || trimmed.includes('entertainment')) {
      categoryId = 'cat-entertainment';
      emoji = '🎬';
      title = 'Cinema & Entertainment';
    } else if (trimmed.includes('consulting') || trimmed.includes('web') || trimmed.includes('freelance') || trimmed.includes('gig')) {
      categoryId = 'cat-freelance';
      emoji = '💻';
      title = 'Consulting & Web Design';
      type = 'income';
    } else if (trimmed.includes('kid') || trimmed.includes('family') || trimmed.includes('baby') || trimmed.includes('school')) {
      categoryId = 'cat-family';
      emoji = '🧸';
      title = 'Kids & Family Expenses';
    } else if (trimmed.includes('salary') || trimmed.includes('payroll') || trimmed.includes('wage')) {
      categoryId = 'cat-salary';
      emoji = '💼';
      title = 'Monthly Salary';
      type = 'income';
    } else if (trimmed.includes('rent') || trimmed.includes('house') || trimmed.includes('apartment')) {
      categoryId = 'cat-housing';
      emoji = '🏠';
      title = 'Rent & Housing';
    }

    items.push({
      title,
      amount,
      categoryId,
      emoji,
      type,
      paymentMethod: 'Mobile Money (MTN / Airtel / M-Pesa)',
      notes: `Extracted from: "${trimmed}"`,
    });
  });

  return items;
}

/**
 * Generate 2-sentence AI spending trajectory and recommendation using Gemini 3.8 Flash
 */
export async function getAISpendingInsights(params: {
  totalBudget: number;
  totalSpent: number;
  totalIncome: number;
  savingsRate: number;
  currencySymbol: string;
  topCategories: Array<{ name: string; amount: number; percentage: number }>;
  dailyAllowance: number;
  daysRemaining: number;
}): Promise<string> {
  try {
    const res = await fetch('/api/gemini/spending-insights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.insight) {
        return data.insight;
      }
    }
  } catch (err) {
    console.warn('AI Insights endpoint failed, using rule-based generator:', err);
  }

  // High quality rule-based fallback
  const percentUsed = Math.round((params.totalSpent / (params.totalBudget || 1)) * 100);
  const isOver = percentUsed > 100;
  const topCat = params.topCategories[0]?.name || 'essential living';

  if (isOver) {
    return `You have currently utilized ${percentUsed}% of your master monthly budget with a net savings rate of ${params.savingsRate}%. Focus on capping discretionary expenses in ${topCat} to curb additional overspending over the next ${params.daysRemaining} days.`;
  } else if (percentUsed > 75) {
    return `You have consumed ${percentUsed}% of your allocated monthly budget, leaving a safe spending allowance of ${params.currencySymbol} ${params.dailyAllowance.toLocaleString()}/day. Prioritize bulk airtime and meal planning to safeguard your remaining reserves before the month concludes.`;
  } else {
    return `Your monthly spending trajectory is disciplined at ${percentUsed}% of budget with a solid ${params.savingsRate}% net savings rate. Continuing to stay under your daily limit of ${params.currencySymbol} ${params.dailyAllowance.toLocaleString()} will ensure your financial targets are comfortably met.`;
  }
}
