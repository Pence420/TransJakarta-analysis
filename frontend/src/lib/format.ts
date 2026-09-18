const numberFmt = new Intl.NumberFormat('en-US');

export function formatNumber(n: number | null | undefined): string {
  return n == null ? '—' : numberFmt.format(n);
}

export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function fmtBytes(bytes: number | null | undefined): string {
  if (!bytes) return '—';
  if (bytes > 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024).toFixed(0)} KB`;
}