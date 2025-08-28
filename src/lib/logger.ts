/**
 * Structured logger for production-ready logging
 * Replaces console.log with proper correlation tracking
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  correlationId?: string;
  userId?: string;
  subscriptionId?: string;
  projectId?: string;
  eventId?: string;
  [key: string]: any;
}

class Logger {
  private isDev = process.env.NODE_ENV === "development";

  private formatMessage(level: LogLevel, message: string, context?: LogContext) {
    const timestamp = new Date().toISOString();
    
    if (this.isDev) {
      // Simple console output for development
      const prefix = level.toUpperCase().padEnd(5);
      const contextStr = context ? ` ${JSON.stringify(context)}` : "";
      console.log(`[${timestamp}] ${prefix} ${message}${contextStr}`);
    } else {
      // Structured JSON for production
      const logEntry = {
        timestamp,
        level,
        message,
        ...context,
      };
      console.log(JSON.stringify(logEntry));
    }
  }

  debug(message: string, context?: LogContext) {
    this.formatMessage("debug", message, context);
  }

  info(message: string, context?: LogContext) {
    this.formatMessage("info", message, context);
  }

  warn(message: string, context?: LogContext) {
    this.formatMessage("warn", message, context);
  }

  error(message: string, error?: Error | any, context?: LogContext) {
    const errorContext = error instanceof Error 
      ? { 
          error: error.message, 
          stack: error.stack,
          ...context 
        }
      : { error: String(error), ...context };
      
    this.formatMessage("error", message, errorContext);
  }

  // Helper for creating correlation IDs
  generateCorrelationId(): string {
    return `corr-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  }

  // PayPal-specific logging helpers
  paypal = {
    webhook: (eventId: string, eventType: string, message: string, context?: LogContext) => {
      this.info(`PayPal Webhook: ${message}`, {
        correlationId: eventId,
        eventId,
        eventType,
        component: "paypal-webhook",
        ...context
      });
    },

    subscription: (subscriptionId: string, message: string, context?: LogContext) => {
      this.info(`PayPal Subscription: ${message}`, {
        subscriptionId,
        component: "paypal-subscription", 
        ...context
      });
    },

    payment: (paymentId: string, message: string, context?: LogContext) => {
      this.info(`PayPal Payment: ${message}`, {
        paymentId,
        component: "paypal-payment",
        ...context
      });
    },

    error: (message: string, error: Error, context?: LogContext) => {
      this.error(`PayPal Error: ${message}`, error, {
        component: "paypal",
        ...context
      });
    }
  };

  // Billing-specific logging
  billing = {
    quota: (userId: string, action: string, result: string, context?: LogContext) => {
      this.info(`Billing Quota: ${action} - ${result}`, {
        userId,
        action,
        result,
        component: "billing-quota",
        ...context
      });
    },

    usage: (subscriptionId: string, message: string, context?: LogContext) => {
      this.info(`Billing Usage: ${message}`, {
        subscriptionId,
        component: "billing-usage",
        ...context
      });
    }
  };
}

export const logger = new Logger();

// Export correlation helper for middleware
export const withCorrelation = <T extends LogContext>(context: T) => context;
