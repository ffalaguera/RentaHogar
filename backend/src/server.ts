import 'dotenv/config';
import app from './app';
import { connectDB } from './config/database';
import logger from './utils/logger';
import { startScheduledTasks } from './services/schedulerService';

const PORT = process.env.PORT || 3000;

const startServer = async (): Promise<void> => {
  try {
    await connectDB();

    startScheduledTasks();

    app.listen(PORT, () => {
      logger.info(`Servidor RentaHogar corriendo en puerto ${PORT}`);
      logger.info(`Entorno: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`API disponible en: http://localhost:${PORT}/api`);
    });
  } catch (error: any) {
    logger.error(`Error al iniciar el servidor: ${error.message}`);
    process.exit(1);
  }
};

startServer();
