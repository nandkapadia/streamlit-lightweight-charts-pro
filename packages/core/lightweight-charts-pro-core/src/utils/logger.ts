/**
 * @fileoverview Simple logger utility
 */

export const logger = {
  error(message: string, context: string, error?: any): void {
    console.error(`[${context}] ${message}`, error);
  },
  warn(message: string, context: string, data?: any): void {
    console.warn(`[${context}] ${message}`, data);
  },
  info(message: string, context: string, data?: any): void {
    console.log(`[${context}] ${message}`, data);
  },
  debug(message: string, context: string, data?: any): void {
    console.debug(`[${context}] ${message}`, data);
  },
};
