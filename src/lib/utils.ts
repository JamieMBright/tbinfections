import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges Tailwind CSS classes with proper precedence handling.
 * Combines clsx for conditional classes with tailwind-merge for deduplication.
 *
 * @param inputs - Class values to merge (strings, arrays, objects, etc.)
 * @returns Merged class string with Tailwind conflicts resolved
 *
 * @example
 * cn('px-2 py-1', 'px-4') // => 'py-1 px-4'
 * cn('text-red-500', condition && 'text-blue-500')
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Formats a number with comma separators for thousands.
 *
 * @param n - The number to format
 * @returns Formatted string with commas (e.g., "1,234,567")
 *
 * @example
 * formatNumber(1000) // => "1,000"
 * formatNumber(1234567.89) // => "1,234,567.89"
 */
export function formatNumber(n: number): string {
  return n.toLocaleString('en-GB');
}

/**
 * Formats a number as a percentage string.
 *
 * @param n - The number to format (0.5 = 50%)
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted percentage string
 *
 * @example
 * formatPercent(0.5) // => "50.0%"
 * formatPercent(0.1234, 2) // => "12.34%"
 */
export function formatPercent(n: number, decimals: number = 1): string {
  return `${(n * 100).toFixed(decimals)}%`;
}

/**
 * Formats a Date object for display in UK format.
 *
 * @param date - The date to format
 * @returns Formatted date string (e.g., "1 Jan 2024")
 *
 * @example
 * formatDate(new Date('2024-01-15')) // => "15 Jan 2024"
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Formats an incidence rate per 100,000 population.
 * Used for epidemiological statistics display.
 *
 * @param rate - The rate per 100,000 to format
 * @returns Formatted rate string with unit
 *
 * @example
 * formatRate(8.4) // => "8.4 per 100,000"
 * formatRate(12.567) // => "12.6 per 100,000"
 */
export function formatRate(rate: number): string {
  return `${rate.toFixed(1)} per 100,000`;
}

/**
 * Clamps a value between a minimum and maximum bound.
 *
 * @param value - The value to clamp
 * @param min - Minimum allowed value
 * @param max - Maximum allowed value
 * @returns The clamped value
 *
 * @example
 * clamp(5, 0, 10) // => 5
 * clamp(-5, 0, 10) // => 0
 * clamp(15, 0, 10) // => 10
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Performs linear interpolation between two values.
 *
 * @param a - Start value
 * @param b - End value
 * @param t - Interpolation factor (0 = a, 1 = b)
 * @returns Interpolated value
 *
 * @example
 * lerp(0, 100, 0.5) // => 50
 * lerp(10, 20, 0.25) // => 12.5
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Creates a debounced version of a function that delays execution
 * until after the specified milliseconds have elapsed since the last call.
 *
 * @param fn - The function to debounce
 * @param ms - Delay in milliseconds
 * @returns Debounced function with cancel method
 *
 * @example
 * const debouncedSearch = debounce((query: string) => {
 *   // Perform search
 * }, 300);
 *
 * debouncedSearch('hello'); // Will execute after 300ms of no calls
 * debouncedSearch.cancel(); // Cancel pending execution
 */
export function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  fn: T,
  ms: number
): ((...args: Parameters<T>) => void) & { cancel: () => void } {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const debounced = (...args: Parameters<T>): void => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, ms);
  };

  debounced.cancel = (): void => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return debounced;
}
