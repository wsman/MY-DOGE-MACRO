/**
 * Utility functions for MY-DOGE-MACRO
 * cn() - Class name merger using clsx and tailwind-merge
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge class names with Tailwind CSS conflict resolution
 * @example cn('px-4 py-2', 'px-6') // Returns 'px-6 py-2'
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}