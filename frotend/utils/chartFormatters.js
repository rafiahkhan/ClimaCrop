/**
 * Format large numbers for chart axes (1K, 1M, 1B) to prevent overlap and improve readability.
 */
export function formatAxisTick(value) {
  if (value == null || value === '' || isNaN(value)) return '';
  const num = Number(value);
  if (num >= 1e9) return (num / 1e9).toFixed(1).replace(/\.0$/, '') + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
  if (num < 1 && num > 0) return num.toFixed(1);
  return String(Math.round(num));
}

/**
 * Format for tooltips - show full number with commas for readability.
 */
export function formatTooltipValue(value) {
  if (value == null || value === '' || isNaN(value)) return 'N/A';
  const num = Number(value);
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
  return num.toLocaleString();
}
