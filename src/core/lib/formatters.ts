export function formatMoney(minorUnits: number, currency = 'BDT', currencySymbol?: string): string {
  const amount = minorUnits / 100;
  if (currencySymbol) return `${currencySymbol}${amount.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return new Intl.NumberFormat('en-BD', { style: 'currency', currency, maximumFractionDigits: 2 }).format(amount);
}

export function formatDate(value: string | Date | null | undefined, options?: Intl.DateTimeFormatOptions): string {
  if (!value) return '—';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-BD', options ?? { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
}

export function formatRelativeDate(value: string): string {
  const date = new Date(value);
  const diffMinutes = Math.round((date.getTime() - Date.now()) / 60_000);
  const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  if (Math.abs(diffMinutes) < 60) return formatter.format(diffMinutes, 'minute');
  const hours = Math.round(diffMinutes / 60);
  if (Math.abs(hours) < 24) return formatter.format(hours, 'hour');
  return formatter.format(Math.round(hours / 24), 'day');
}

export function titleCase(value: string): string {
  return value.toLowerCase().replace(/(^|[_-])([a-z])/g, (_match, separator: string, letter: string) => `${separator ? ' ' : ''}${letter.toUpperCase()}`);
}

export function daysLabel(days: number): string {
  if (days <= 0) return 'Expired';
  return `${days} day${days === 1 ? '' : 's'} left`;
}
