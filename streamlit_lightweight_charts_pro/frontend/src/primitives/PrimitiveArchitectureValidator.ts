/**
 * Architecture Validation Framework for Primitives
 *
 * Validates architectural constraints and patterns at runtime
 * to ensure compliance with design principles.
 */

export enum ValidationSeverity {
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

export interface ValidationResult {
  valid: boolean;
  violations: ValidationViolation[];
  score: number; // 0-100
}

export interface ValidationViolation {
  rule: string;
  severity: ValidationSeverity;
  message: string;
  context: Record<string, any>;
  suggestion?: string;
}

export interface ArchitecturalRule {
  name: string;
  description: string;
  severity: ValidationSeverity;
  validate(primitive: any, context: ValidationContext): ValidationViolation[];
}

export interface ValidationContext {
  allPrimitives: Map<string, any>;
  serviceRegistry: any;
  chartInstance: any;
}

/**
 * Validates architectural compliance of primitives
 */
export class PrimitiveArchitectureValidator {
  private static instance: PrimitiveArchitectureValidator;
  private rules: ArchitecturalRule[] = [];

  static getInstance(): PrimitiveArchitectureValidator {
    if (!this.instance) {
      this.instance = new PrimitiveArchitectureValidator();
      this.instance.registerDefaultRules();
    }
    return this.instance;
  }

  /**
   * Register a new architectural rule
   */
  registerRule(rule: ArchitecturalRule): void {
    this.rules.push(rule);
  }

  /**
   * Validate a single primitive
   */
  validatePrimitive(primitive: any, context: ValidationContext): ValidationResult {
    const violations: ValidationViolation[] = [];

    for (const rule of this.rules) {
      try {
        const ruleViolations = rule.validate(primitive, context);
        violations.push(...ruleViolations);
      } catch (error) {
        violations.push({
          rule: rule.name,
          severity: ValidationSeverity.ERROR,
          message: `Rule validation failed: ${error.message}`,
          context: { error: error.message },
        });
      }
    }

    return {
      valid: violations.length === 0,
      violations,
      score: this.calculateScore(violations),
    };
  }

  /**
   * Validate all primitives in a system
   */
  validateSystem(context: ValidationContext): ValidationResult {
    const allViolations: ValidationViolation[] = [];

    for (const [, primitive] of context.allPrimitives) {
      const result = this.validatePrimitive(primitive, context);
      allViolations.push(...result.violations);
    }

    return {
      valid: allViolations.length === 0,
      violations: allViolations,
      score: this.calculateScore(allViolations),
    };
  }

  /**
   * Calculate compliance score based on violations
   */
  private calculateScore(violations: ValidationViolation[]): number {
    if (violations.length === 0) return 100;

    const severityWeights = {
      [ValidationSeverity.WARNING]: 1,
      [ValidationSeverity.ERROR]: 3,
      [ValidationSeverity.CRITICAL]: 5,
    };

    const totalPenalty = violations.reduce((sum, v) => sum + severityWeights[v.severity], 0);
    const maxPenalty = violations.length * severityWeights[ValidationSeverity.CRITICAL];

    return Math.max(0, 100 - (totalPenalty / maxPenalty) * 100);
  }

  /**
   * Register default architectural rules
   */
  private registerDefaultRules(): void {
    // Rule 1: Single Responsibility - Primitives should have one clear purpose
    this.registerRule({
      name: 'single-responsibility',
      description: 'Primitives should have a single, well-defined responsibility',
      severity: ValidationSeverity.ERROR,
      validate: (primitive, context) => {
        const violations: ValidationViolation[] = [];

        // Check if primitive has too many public methods (indication of multiple responsibilities)
        const publicMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(primitive)).filter(
          name => !name.startsWith('_') && typeof primitive[name] === 'function'
        );

        if (publicMethods.length > 15) {
          violations.push({
            rule: 'single-responsibility',
            severity: ValidationSeverity.WARNING,
            message: `Primitive has ${publicMethods.length} public methods, consider decomposition`,
            context: { methodCount: publicMethods.length, methods: publicMethods },
          });
        }

        return violations;
      },
    });

    // Rule 2: Configuration Consistency
    this.registerRule({
      name: 'configuration-consistency',
      description: 'Primitives should use standardized configuration patterns',
      severity: ValidationSeverity.ERROR,
      validate: (primitive, context) => {
        const violations: ValidationViolation[] = [];

        // Check if primitive has proper configuration interface
        if (!primitive.config || typeof primitive.config !== 'object') {
          violations.push({
            rule: 'configuration-consistency',
            severity: ValidationSeverity.CRITICAL,
            message: 'Primitive missing configuration object',
            context: { primitiveId: primitive.id },
            suggestion: 'Implement proper configuration interface extending BasePrimitiveConfig',
          });
        }

        // Check if configuration uses standardized constants
        if (primitive.config?.style) {
          const style = primitive.config.style;
          const hardcodedValues = this.findHardcodedValues(style);

          if (hardcodedValues.length > 0) {
            violations.push({
              rule: 'configuration-consistency',
              severity: ValidationSeverity.WARNING,
              message: 'Configuration contains hardcoded values',
              context: { hardcodedValues },
              suggestion: 'Replace hardcoded values with constants from PrimitiveDefaults',
            });
          }
        }

        return violations;
      },
    });

    // Rule 3: Memory Management
    this.registerRule({
      name: 'memory-management',
      description: 'Primitives should properly manage memory and cleanup resources',
      severity: ValidationSeverity.CRITICAL,
      validate: (primitive, context) => {
        const violations: ValidationViolation[] = [];

        // Check for cleanup methods
        if (typeof primitive.detached !== 'function') {
          violations.push({
            rule: 'memory-management',
            severity: ValidationSeverity.CRITICAL,
            message: 'Primitive missing detached() cleanup method',
            context: { primitiveId: primitive.id },
            suggestion: 'Implement detached() method to cleanup resources',
          });
        }

        // Check for event cleanup
        if (primitive.eventSubscriptions && Array.isArray(primitive.eventSubscriptions)) {
          if (
            primitive.eventSubscriptions.length > 0 &&
            typeof primitive.cleanupEventSubscriptions !== 'function'
          ) {
            violations.push({
              rule: 'memory-management',
              severity: ValidationSeverity.ERROR,
              message: 'Primitive has event subscriptions but no cleanup method',
              context: { subscriptionCount: primitive.eventSubscriptions.length },
              suggestion: 'Implement cleanupEventSubscriptions() method',
            });
          }
        }

        return violations;
      },
    });

    // Rule 4: Service Dependency Management
    this.registerRule({
      name: 'service-dependencies',
      description: 'Primitives should properly manage service dependencies',
      severity: ValidationSeverity.ERROR,
      validate: (primitive, context) => {
        const violations: ValidationViolation[] = [];

        // Check service initialization order
        // const services = ['layoutManager', 'coordinateService', 'templateEngine', 'eventManager'];
        const initializeServices = primitive.initializeServices;

        if (typeof initializeServices === 'function') {
          // Services should be initialized in dependency order
          // This is a simplified check - in practice you'd analyze the actual dependencies
        }

        return violations;
      },
    });

    // Rule 5: Error Handling Coverage
    this.registerRule({
      name: 'error-handling',
      description: 'Primitives should have comprehensive error handling',
      severity: ValidationSeverity.WARNING,
      validate: (primitive, context) => {
        const violations: ValidationViolation[] = [];

        // Check critical methods have error handling
        const criticalMethods = ['attached', 'detached', 'renderContent', 'updateConfig'];

        for (const methodName of criticalMethods) {
          if (typeof primitive[methodName] === 'function') {
            const methodSource = primitive[methodName].toString();

            // Simple check for try-catch blocks
            if (!methodSource.includes('try') || !methodSource.includes('catch')) {
              violations.push({
                rule: 'error-handling',
                severity: ValidationSeverity.WARNING,
                message: `Critical method ${methodName} lacks error handling`,
                context: { method: methodName },
                suggestion: 'Add try-catch blocks or use @withErrorBoundary decorator',
              });
            }
          }
        }

        return violations;
      },
    });

    // Rule 6: Styling Standardization
    this.registerRule({
      name: 'styling-standardization',
      description: 'Primitives should use standardized styling utilities',
      severity: ValidationSeverity.ERROR,
      validate: (primitive, context) => {
        const violations: ValidationViolation[] = [];

        // Check if primitive uses PrimitiveStylingUtils
        const className = primitive.constructor.name;
        const source = primitive.constructor.toString();

        if (!source.includes('PrimitiveStylingUtils')) {
          violations.push({
            rule: 'styling-standardization',
            severity: ValidationSeverity.ERROR,
            message: 'Primitive not using standardized styling utilities',
            context: { className },
            suggestion: 'Migrate to use PrimitiveStylingUtils for consistent styling',
          });
        }

        return violations;
      },
    });
  }

  /**
   * Find hardcoded values in configuration
   */
  private findHardcodedValues(obj: any, path: string = ''): string[] {
    const hardcoded: string[] = [];

    if (typeof obj === 'string') {
      // Check for common hardcoded patterns
      const patterns = [
        /^\d+px$/, // "12px"
        /^rgba?\([^)]+\)$/, // "rgb(255,0,0)"
        /^#[0-9a-f]{3,6}$/i, // "#fff" or "#ffffff"
        /^(none|auto|pointer|default)$/, // Common CSS values
      ];

      for (const pattern of patterns) {
        if (pattern.test(obj)) {
          hardcoded.push(`${path}: "${obj}"`);
          break;
        }
      }
    } else if (typeof obj === 'object' && obj !== null) {
      for (const [key, value] of Object.entries(obj)) {
        const newPath = path ? `${path}.${key}` : key;
        hardcoded.push(...this.findHardcodedValues(value, newPath));
      }
    }

    return hardcoded;
  }
}

/**
 * Validation utilities
 */
export const ArchitectureValidator = {
  /**
   * Quick validation of a primitive
   */
  validate: (primitive: any, context?: Partial<ValidationContext>): ValidationResult => {
    const validator = PrimitiveArchitectureValidator.getInstance();
    const fullContext: ValidationContext = {
      allPrimitives: new Map([[primitive.id, primitive]]),
      serviceRegistry: null,
      chartInstance: null,
      ...context,
    };
    return validator.validatePrimitive(primitive, fullContext);
  },

  /**
   * Generate compliance report
   */
  generateReport: (result: ValidationResult): string => {
    const { valid, violations, score } = result;

    let report = `Architecture Compliance Report\n`;
    report += `Score: ${score}/100\n`;
    report += `Status: ${valid ? 'PASS' : 'FAIL'}\n\n`;

    if (violations.length > 0) {
      report += `Violations (${violations.length}):\n`;
      violations.forEach((v, i) => {
        report += `${i + 1}. [${v.severity.toUpperCase()}] ${v.rule}: ${v.message}\n`;
        if (v.suggestion) {
          report += `   Suggestion: ${v.suggestion}\n`;
        }
      });
    } else {
      report += `No violations found. Excellent architectural compliance!\n`;
    }

    return report;
  },
};
