import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Helper function to search through an array of objects
 * @param items The array of items to search through
 * @param searchText The text to search for
 * @param searchFields An array of field names to search in
 * @returns Filtered array of items that match the search
 */
export function searchItems<T>(
  items: T[], 
  searchText: string, 
  searchFields: (keyof T)[]
): T[] {
  if (!items || items.length === 0 || !searchText) return [];

  const lowercaseSearchText = searchText.toLowerCase();

  return items.filter(item => {
    return searchFields.some(field => {
      const value = item[field];
      if (value === null || value === undefined) return false;

      // Handle both string and number values
      return String(value).toLowerCase().includes(lowercaseSearchText);
    });
  });
}

/**
 * Get a URL parameter value
 */
export function getUrlParam(paramName: string): string | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  return params.get(paramName);
}