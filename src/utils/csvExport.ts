import { Transaction, Category } from '../types';

export interface CSVExportResult {
  success: boolean;
  message: string;
  count: number;
}

/**
 * Exports a set of transactions to a cleanly formatted UTF-8 CSV file.
 * Includes Date, Title, Category, Type (Income/Expense), Amount (USh), and Notes.
 * Does NOT call window.alert.
 */
export function exportTransactionsToCSV(
  transactions: Transaction[],
  categories: Category[],
  filename: string = `centra_ledger_${new Date().toISOString().split('T')[0]}.csv`,
  currencyLabel: string = 'USh'
): CSVExportResult {
  if (transactions.length === 0) {
    return {
      success: false,
      message: 'No transactions available to export for this selection.',
      count: 0,
    };
  }

  const headers = [
    'Date',
    'Title',
    'Category',
    'Type (Income/Expense)',
    `Amount (${currencyLabel})`,
    'Payment Channel',
    'Recipient',
    'Notes',
  ];

  const escapeCSV = (str: string | undefined): string => {
    if (!str) return '""';
    return `"${str.replace(/"/g, '""')}"`;
  };

  const rows = transactions.map((tx) => {
    const category = categories.find((c) => c.id === tx.categoryId);
    const categoryName = category ? `${category.emoji ? `${category.emoji} ` : ''}${category.name}` : 'Other';
    const typeLabel = tx.type === 'income' ? 'Income' : 'Expense';

    return [
      escapeCSV(tx.date),
      escapeCSV(tx.title),
      escapeCSV(categoryName),
      escapeCSV(typeLabel),
      tx.amount, // numeric amount
      escapeCSV(tx.paymentMethod),
      escapeCSV(tx.recipient || ''),
      escapeCSV(tx.notes || ''),
    ].join(',');
  });

  // UTF-8 BOM (\uFEFF) ensures Excel and external spreadsheet tools decode special characters & emojis properly
  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return {
    success: true,
    message: `Exported ${transactions.length} transactions successfully to ${filename}`,
    count: transactions.length,
  };
}

/**
 * Daily Auto-Export helper: formats current day's transactions into CSV
 */
export function exportTodayTransactionsToCSV(
  transactions: Transaction[],
  categories: Category[],
  currencyLabel: string = 'USh'
): CSVExportResult {
  const today = new Date().toISOString().split('T')[0];
  const todayTransactions = transactions.filter((t) => t.date === today);

  if (todayTransactions.length === 0) {
    return {
      success: false,
      message: `No transactions recorded for today (${today}) yet to export.`,
      count: 0,
    };
  }

  const filename = `centra_daily_export_${today}.csv`;
  return exportTransactionsToCSV(todayTransactions, categories, filename, currencyLabel);
}
