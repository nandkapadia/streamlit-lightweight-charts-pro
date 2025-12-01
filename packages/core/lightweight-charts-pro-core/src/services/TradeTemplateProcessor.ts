/**
 * Trade Template Processor
 *
 * Processes HTML templates for trade tooltips and markers using the common TemplateEngine.
 * This provides a unified interface for trade-specific template processing while leveraging
 * the existing template infrastructure used by legends and other primitives.
 */

import { TemplateEngine, TemplateOptions, TemplateResult } from './TemplateEngine';
import { TemplateContext } from '../types/ChartInterfaces';

export interface TradeTemplateData {
  tradeType: 'long' | 'short';
  entryPrice: number;
  exitPrice: number;
  pnl: number;
  pnlPercentage: number;
  quantity?: number;
  notes?: string;
  tradeId?: string;
  entryTime?: string | number;
  exitTime?: string | number;
}

// Re-export common types for convenience
export type { TemplateOptions, TemplateResult };

/**
 * TradeTemplateProcessor - Trade-specific template processing facade
 *
 * Provides a simplified interface for processing trade templates while
 * delegating to the common TemplateEngine for actual processing. This
 * ensures consistency with legend templates and other primitives.
 *
 * Architecture:
 * - Facade pattern over TemplateEngine
 * - Static methods (no instantiation needed)
 * - Supports flexible data structure (core fields + additional_data)
 * - Backend-driven display values (no frontend calculations)
 *
 * @export
 * @class TradeTemplateProcessor
 *
 * @example
 * ```typescript
 * const template = '<div>P&L: $$pnl$$ ($$pnl_percentage$$%)</div>';
 * const data = {
 *   pnl: 100.50,
 *   pnl_percentage: 2.5,
 *   isProfitable: true
 * };
 *
 * const result = TradeTemplateProcessor.processTemplate(template, data);
 * console.log(result.content); // '<div>P&L: 100.50 (2.5%)</div>'
 * ```
 */
export class TradeTemplateProcessor {
  /**
   * Process trade template with data
   *
   * Converts trade data to template context and processes using the
   * common TemplateEngine. Handles both TradeTemplateData and arbitrary
   * data objects with additional_data fields.
   *
   * @static
   * @param {string} template - HTML template with $$placeholder$$ syntax
   * @param {TradeTemplateData | Record<string, any>} data - Trade data object
   * @param {TemplateOptions} [options={}] - Optional processing options
   * @returns {TemplateResult} Processed template with content and errors
   *
   * @example
   * ```typescript
   * const result = TradeTemplateProcessor.processTemplate(
   *   '<span style="color: $$profit_color$$">$$side$$</span>',
   *   {
   *     isProfitable: true,
   *     side: 'BUY',
   *     profit_color: '#00ff88'
   *   }
   * );
   * ```
   */
  static processTemplate(
    template: string,
    data: TradeTemplateData | Record<string, any>,
    options: TemplateOptions = {}
  ): TemplateResult {
    // Step 1: Get singleton TemplateEngine instance
    const templateEngine = TemplateEngine.getInstance();

    // Step 2: Convert trade data to TemplateContext format
    // Handles flexible data structure with additional_data pattern
    const context: TemplateContext = {
      customData: this.convertTradeDataToContext(data),
    };

    // Step 3: Delegate to common template engine for processing
    // Ensures consistency with legend and other template processing
    return templateEngine.processTemplate(template, context, options);
  }

  /**
   * Convert trade data to template context format
   * Now supports flexible data structure with additional_data fields
   */
  private static convertTradeDataToContext(
    data: TradeTemplateData | Record<string, any>
  ): Record<string, unknown> {
    // Start with all data fields (supports additional_data pattern)
    const context: Record<string, unknown> = { ...data };

    // Cast to any for flexible field access
    const flexData = data as any;

    // Add derived values based on isProfitable flag from backend
    const isProfitable = flexData.isProfitable ?? flexData.is_profitable ?? false;
    const pnl = flexData.pnl ?? 0;
    const exitPrice = flexData.exitPrice ?? flexData.exit_price ?? 0;
    const entryPrice = flexData.entryPrice ?? flexData.entry_price ?? 0;
    const priceDifference = exitPrice - entryPrice;

    // Get trade type from various possible fields
    const tradeType = (flexData.tradeType || flexData.trade_type || 'long')
      .toString()
      .toLowerCase();

    // Add standard derived fields
    context.trade_type = tradeType.toUpperCase();
    context.trade_type_lower = tradeType.toLowerCase();
    context.entry_price = entryPrice;
    context.exit_price = exitPrice;
    context.pnl = pnl;
    context.pnl_percentage = flexData.pnlPercentage ?? flexData.pnl_percentage ?? 0;
    context.is_profitable = isProfitable;
    context.profit_loss = isProfitable ? 'PROFIT' : 'LOSS';
    context.profit_loss_lower = isProfitable ? 'profit' : 'loss';
    context.pnl_sign = pnl >= 0 ? '+' : '';
    context.price_difference = priceDifference;
    context.price_diff_sign = priceDifference >= 0 ? '+' : '';

    // Add ID fields with fallbacks
    context.trade_id = flexData.tradeId ?? flexData.trade_id ?? flexData.id;
    context.id = flexData.id ?? flexData.tradeId ?? flexData.trade_id;

    return context;
  }

  /**
   * Get default tooltip template
   */
  static getDefaultTooltipTemplate(): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 180px; padding: 4px;">
        <div style="font-weight: bold; font-size: 10px; margin-bottom: 3px; color: $$is_profitable$$ ? '#4CAF50' : '#F44336';">
          $$trade_type$$
        </div>
        <div style="font-size: 10px; line-height: 1.3;">
          <div>Entry: $$entry_price$$</div>
          <div>Exit: $$exit_price$$</div>
          <div style="color: $$is_profitable$$ ? '#4CAF50' : '#F44336'; font-weight: bold;">
            P&L: $$pnl$$ ($$pnl_percentage$$%)
          </div>
          $$notes$$ ? '<div style="margin-top: 2px; font-size: 9px; color: #888;">$$notes$$</div>' : ''
        </div>
      </div>
    `;
  }

  /**
   * Get default marker template
   */
  static getDefaultMarkerTemplate(): string {
    return 'E: $$entry_price$$';
  }

  /**
   * Get available placeholders documentation
   */
  static getPlaceholdersDocumentation(): Record<string, string> {
    return {
      $$trade_type$$: 'Trade type in uppercase (LONG or SHORT)',
      $$trade_type_lower$$: 'Trade type in lowercase (long or short)',
      $$entry_price$$: 'Entry price formatted to 2 decimal places',
      $$exit_price$$: 'Exit price formatted to 2 decimal places',
      $$pnl$$: 'Profit/Loss amount with sign (+/-)',
      $$pnl_percentage$$: 'Profit/Loss percentage formatted to 1 decimal place',
      $$quantity$$: 'Trade quantity',
      $$notes$$: 'Trade notes or comments',
      $$trade_id$$: 'Trade ID',
      $$entry_time$$: 'Entry time as string',
      $$exit_time$$: 'Exit time as string',
      $$is_profitable$$: 'Boolean indicating if trade is profitable (true/false)',
      $$profit_loss$$: 'Profit/Loss status in uppercase (PROFIT or LOSS)',
      $$profit_loss_lower$$: 'Profit/Loss status in lowercase (profit or loss)',
      $$price_difference$$: 'Price difference with sign (+/-)',
      $$pnl_sign$$: 'P&L sign only (+ or -)',
    };
  }
}
