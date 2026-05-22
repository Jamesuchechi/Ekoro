type LogLevel = "info" | "warn" | "error" | "debug";

export const logger = {
  info(message: string, meta?: any) {
    this.log("info", message, meta);
  },
  warn(message: string, meta?: any) {
    this.log("warn", message, meta);
  },
  error(message: string, error?: any, meta?: any) {
    const errorMeta = error instanceof Error 
      ? { errorMessage: error.message, stack: error.stack, ...meta }
      : { error, ...meta };
    this.log("error", message, errorMeta);
  },
  debug(message: string, meta?: any) {
    if (process.env.NODE_ENV === "development") {
      this.log("debug", message, meta);
    }
  },
  log(level: LogLevel, message: string, meta?: any) {
    const timestamp = new Date().toISOString();
    const logData = {
      timestamp,
      level,
      message,
      ...(meta ? { meta } : {}),
    };

    if (process.env.NODE_ENV === "production") {
      console.log(JSON.stringify(logData));
    } else {
      const colors = {
        error: "\x1b[31m",
        warn: "\x1b[33m",
        info: "\x1b[36m",
        debug: "\x1b[35m"
      };
      const color = colors[level] || "\x1b[37m";
      const reset = "\x1b[0m";
      
      if (meta) {
        console.log(`[${timestamp}] ${color}${level.toUpperCase()}${reset}: ${message}`, meta);
      } else {
        console.log(`[${timestamp}] ${color}${level.toUpperCase()}${reset}: ${message}`);
      }
    }
  }
};

export default logger;
