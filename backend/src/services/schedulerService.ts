import cron from 'node-cron';
import { Payment, TenantAssignment, Notification } from '../models';
import logger from '../utils/logger';

export const generateMonthlyPayments = async (
  force = false,
  ownerId: string | null = null,
): Promise<{ created: number; skipped: number }> => {
  const result = { created: 0, skipped: 0 };
  try {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    if (!force && now.getDate() !== 1) {
      logger.info('generateMonthlyPayments: No es el día 1 del mes, omitiendo generación.');
      return result;
    }
    logger.info(`Generando pagos automáticos para ${currentMonth}/${currentYear}`);
    const assignmentFilter: Record<string, any> = { isActive: true };
    if (ownerId) assignmentFilter.owner = ownerId;
    const assignments = await TenantAssignment.find(assignmentFilter);
    if (!assignments || assignments.length === 0) {
      logger.info('No hay asignaciones activas para generar pagos.');
      return result;
    }
    let created = 0;
    let skipped = 0;
    for (const assignment of assignments) {
      try {
        const existingPayment = await Payment.findOne({
          tenant: assignment.tenant,
          property: assignment.property,
          month: currentMonth,
          year: currentYear,
        });
        if (existingPayment) {
          skipped++;
          logger.debug(
            `Pago ya existe para tenant ${assignment.tenant}, property ${assignment.property}, ${currentMonth}/${currentYear}`,
          );
          continue;
        }
        const dueDate = new Date(currentYear, currentMonth - 1, 5);
        const payment = await Payment.create({
          tenant: assignment.tenant,
          property: assignment.property,
          owner: assignment.owner,
          amount: assignment.monthlyRent,
          month: currentMonth,
          year: currentYear,
          dueDate,
          status: 'pending',
          paymentMethod: 'transfer',
        });
        created++;
        logger.info(
          `Pago creado: ${payment._id} - Tenant: ${assignment.tenant}, Property: ${assignment.property}, Amount: ${assignment.monthlyRent}€`,
        );
      } catch (error) {
        const err = error as Error;
        logger.error(
          `Error al crear pago para assignment ${(assignment as any)._id}: ${err.message}`,
        );
      }
    }
    result.created = created;
    result.skipped = skipped;
    logger.info(
      `Generación de pagos completada: ${created} creados, ${skipped} omitidos (ya existían)`,
    );
  } catch (error) {
    const err = error as Error;
    logger.error(`Error en generateMonthlyPayments: ${err.message}`);
  }
  return result;
};

export const updateOverduePayments = async (): Promise<void> => {
  try {
    const now = new Date();
    const overduePayments = await Payment.find({
      status: 'pending',
      dueDate: { $lt: now },
    });
    if (!overduePayments || overduePayments.length === 0) {
      logger.debug('No hay pagos vencidos para actualizar.');
      return;
    }
    let updated = 0;
    for (const payment of overduePayments) {
      try {
        (payment as any).status = 'overdue';
        await (payment as any).save();
        updated++;
        await Notification.create({
          recipient: (payment as any).owner,
          type: 'payment',
          title: 'Pago vencido',
          message: `El pago de ${(payment as any).amount}€ del mes ${(payment as any).month}/${(payment as any).year} ha vencido.`,
          relatedModel: 'Payment',
          relatedId: (payment as any)._id,
        });
        logger.debug(`Pago ${(payment as any)._id} marcado como vencido.`);
      } catch (error) {
        const err = error as Error;
        logger.error(`Error al actualizar pago ${(payment as any)._id}: ${err.message}`);
      }
    }
    if (updated > 0) {
      logger.info(`Actualización de pagos vencidos: ${updated} pagos actualizados a 'overdue'`);
    }
  } catch (error) {
    const err = error as Error;
    logger.error(`Error en updateOverduePayments: ${err.message}`);
  }
};

export const startScheduledTasks = (): void => {
  cron.schedule('0 0 1 * *', async () => {
    logger.info('Ejecutando tarea programada: generateMonthlyPayments');
    await generateMonthlyPayments();
  });
  cron.schedule('0 0 * * *', async () => {
    logger.info('Ejecutando tarea programada: updateOverduePayments');
    await updateOverduePayments();
  });
  logger.info('Tareas programadas iniciadas:');
  logger.info('  - Generación de pagos mensuales: día 1 de cada mes a las 00:00');
  logger.info('  - Actualización de pagos vencidos: diariamente a las 00:00');
};
