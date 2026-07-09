/** Format ISO date for `<input type="date" />`. */
export function toDateInputValue(iso?: string | null): string {
  if (!iso) return '';
  return iso.slice(0, 10);
}

/** Parse date input to ISO string (midday UTC to avoid TZ drift). */
export function fromDateInputValue(value: string): string | undefined {
  if (!value) return undefined;
  return new Date(`${value}T12:00:00`).toISOString();
}

export function formatPayPeriod(start: string, end: string): string {
  return `${new Date(start).toLocaleDateString()} – ${new Date(end).toLocaleDateString()}`;
}
