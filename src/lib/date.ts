export function getDateRange(dateStr: string) {
  return {
    gte: new Date(`${dateStr}T00:00:00.000Z`),
    lt: new Date(`${dateStr}T23:59:59.999Z`),
  };
}

export function formatMinutes(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return { hours, minutes };
}

export function toIsoDate(date: Date) {
  return date.toISOString().split('T')[0];
}
