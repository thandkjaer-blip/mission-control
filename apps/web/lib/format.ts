export function formatRelativeTime(value: string | null) {
  if (!value) {
    return '—';
  }

  const date = new Date(value);
  const diffMs = date.getTime() - Date.now();

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const minutes = Math.round(diffMs / 60000);

  if (Math.abs(minutes) < 60) {
    return formatter.format(minutes, 'minute');
  }

  const hours = Math.round(diffMs / 3600000);
  if (Math.abs(hours) < 48) {
    return formatter.format(hours, 'hour');
  }

  const days = Math.round(diffMs / 86400000);
  return formatter.format(days, 'day');
}

export function formatDateTime(value: string | null) {
  if (!value) {
    return '—';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export function formatUsd(value: number) {
  return new Intl.NumberFormat('en', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatPercent(value: number) {
  return `${value.toFixed(0)}%`;
}

export function titleCase(value: string) {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
