type LogLevel = "debug" | "info" | "warn" | "error";

interface LogPayload {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
  [key: string]: unknown;
}

class StructuredLogger {
  private isProd = process.env.NODE_ENV === "production";

  private log(level: LogLevel, message: string, meta?: Record<string, unknown> | Error) {
    const timestamp = new Date().toISOString();
    let errorObj: LogPayload["error"] = undefined;
    let contextObj: Record<string, unknown> = {};

    if (meta instanceof Error) {
      errorObj = {
        message: meta.message,
        stack: meta.stack,
        code: (meta as any).code,
      };
    } else if (meta && typeof meta === "object") {
      const { error, ...rest } = meta;
      if (error instanceof Error) {
        errorObj = {
          message: error.message,
          stack: error.stack,
          code: (error as any).code,
        };
      }
      contextObj = rest;
    }

    const payload: LogPayload = {
      level,
      message,
      timestamp,
      ...(Object.keys(contextObj).length > 0 ? { context: contextObj } : {}),
      ...(errorObj ? { error: errorObj } : {}),
    };

    if (this.isProd) {
      // High-performance machine-readable NDJSON
      const output = JSON.stringify(payload);
      if (level === "error") {
        console.error(output);
      } else if (level === "warn") {
        console.warn(output);
      } else {
        console.log(output);
      }
    } else {
      // Clean readable format for local development
      const prefix = `[${timestamp.slice(11, 19)}] [${level.toUpperCase()}]`;
      if (level === "error") {
        console.error(`${prefix} ${message}`, meta || "");
      } else if (level === "warn") {
        console.warn(`${prefix} ${message}`, meta || "");
      } else {
        console.log(`${prefix} ${message}`, meta || "");
      }
    }
  }

  debug(message: string, meta?: Record<string, unknown>) {
    if (process.env.DEBUG || !this.isProd) {
      this.log("debug", message, meta);
    }
  }

  info(message: string, meta?: Record<string, unknown>) {
    this.log("info", message, meta);
  }

  warn(message: string, meta?: Record<string, unknown> | Error) {
    this.log("warn", message, meta);
  }

  error(message: string, meta?: Record<string, unknown> | Error) {
    this.log("error", message, meta);
  }
}

export const logger = new StructuredLogger();
