import { createLogger, format, transports, Logger } from "winston";

const logger: Logger = createLogger({
  level: "info",
  format: format.combine(
    format.timestamp({
      format: "YYYY-MM-DD HH:mm:ss",
    }),
    format.errors({ stack: true }),
    format.splat(),
    format.printf(({ level, message, timestamp }) => {
      return `${timestamp}|${level}|${message}`;
    })
  ),
  transports: [new transports.File({ filename: "./storage/web.log" })],
});

logger.add(
  new transports.Console({
    format: format.combine(
      format.colorize(),
      format.printf(({ level, message, timestamp }) => {
        return `${timestamp}|${level}|${message}`;
      })
    ),
  })
);

export default logger;
