export const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`;

export const formatDateTime = (timestamp: number | null) => {
  if (!timestamp) {
    return '-';
  }
  return new Date(timestamp * 1000).toLocaleString();
};

export const formatShortDate = (timestamp: number) =>
  new Date(timestamp * 1000).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
