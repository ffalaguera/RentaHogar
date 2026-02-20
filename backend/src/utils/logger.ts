import winston from 'winston';
import path from 'path';

const isDev = process.env.NODE_ENV !== 'production';

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  isDev ? winston.format.colorize() : winston.format.uncolorize(),
  winston.format.printf((info: any) => {
    const { timestamp, level, message, stack } = info;
    return stack
      ? `[${timestamp}] ${level}: ${message}\n${stack}`
      : `[${timestamp}] ${level}: ${message}`;
  }),
);

const logDir = path.join(__dirname, '../../logs');
const transports: winston.transport[] = [
  new winston.transports.File({
    filename: path.join(logDir, 'error.log'),
    level: 'error',
    maxsize: 5242880,
    maxFiles: 5,
  }),
  new winston.transports.File({
    filename: path.join(logDir, 'combined.log'),
    maxsize: 5242880,
    maxFiles: 5,
  }),
];

if (isDev) {
  transports.push(
    new winston.transports.Console({
      level: 'debug',
    }),
  );
} else {
  transports.push(
    new winston.transports.Console({
      level: 'error',
    }),
  );
}

const logger = winston.createLogger({
  level: isDev ? 'debug' : 'info',
  format: logFormat,
  transports,
  exitOnError: false,
});

export default logger;
