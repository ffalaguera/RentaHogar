import 'dotenv/config';
import express from 'express';
import path from 'path';
import cors from 'cors';
import morgan from 'morgan';
import routes from './routes';
import { errorHandler, notFound } from './middleware/errorHandler';
import logger from './utils/logger';

const app = express();

// En desarrollo: permitir cualquier localhost (puerto 4200, 61748, etc.)
// En producción: usar FRONTEND_URL
const corsOrigin =
  process.env.NODE_ENV === 'development'
    ? (origin: string | undefined, cb: (err: Error | null, allow?: boolean) => void) => {
        const allowed = !origin || /^https?:\/\/localhost(:\d+)?$/.test(origin);
        (cb as (err: Error | null, allow?: boolean | string) => void)(
          null,
          allowed ? (origin ?? true) : false,
        );
      }
    : (process.env.FRONTEND_URL || 'http://localhost:4200');

app.use(
  cors({
    origin: corsOrigin as any,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV === 'development') {
  app.use(
    morgan('dev', {
      stream: { write: (message: string) => logger.debug(message.trim()) },
    }),
  );
} else {
  app.use(
    morgan('combined', {
      skip: (_req, res) => res.statusCode < 400,
      stream: { write: (message: string) => logger.error(message.trim()) },
    }),
  );
}

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.get('/api/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'RentaHogar API funcionando correctamente.',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

app.use('/api', routes);

app.use(notFound);

app.use(errorHandler);

export default app;
