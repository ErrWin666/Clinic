const app = require("./app");
const config = require("./config");
const { connectDatabase, syncDatabase, closeDatabase } = require("./database");
const logger = require("./utils/logger");
const schedule = require("node-schedule");
const BackupService = require("./services/BackupService");
const SettingsService = require("./services/SettingsService");
const NotificationScheduler = require("./services/NotificationScheduler");
const PatientRelationshipService = require("./services/PatientRelationshipService");
const TelegramBotService = require("./services/TelegramBotService");
const { withLock } = require("./utils/schedulerLock");

let backupJob = null;
let telegramBot = null;

async function scheduleBackupJob() {
  const settingsService = new SettingsService();
  const backupService = new BackupService();
  const { enabled, hour, minute } = await settingsService.getBackupSchedule();

  if (backupJob) {
    backupJob.cancel();
    backupJob = null;
  }

  if (!enabled) {
    logger.info("Automatic backup is disabled");
    return;
  }

  const rule = new schedule.RecurrenceRule();
  rule.hour = hour;
  rule.minute = minute;

  backupJob = schedule.scheduleJob(rule, async () => {
    logger.info("Running scheduled backup...");
    try {
      await withLock("backup", async () => {
        await backupService.createBackup("auto");
        logger.info("Scheduled backup completed");
      });
    } catch (error) {
      logger.error({ message: "Scheduled backup failed", error: error.message });
    }
  });

  logger.info(`Scheduled backup at ${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")} daily`);
}

async function rescheduleBackup() {
  await scheduleBackupJob();
}

async function startServer() {
  try {
    await connectDatabase();
    await syncDatabase();

    await scheduleBackupJob();

    if (!config.scheduler.enabled) {
      logger.info("Scheduler disabled (SCHEDULER_ENABLED=false); skipping job registration");
    } else {
      const notificationService = new NotificationScheduler();

      // Catch-up: if the server was down at 08:00 today, run the check on startup.
      // We compare the last recorded run date with today's date.
      try {
        const { Settings } = require("./models");
        const lastRunRow = await Settings.findOne({ where: { key: "notification.lastRunDate" } });
        const todayStr = new Date().toISOString().split("T")[0];
        const lastRunDate = lastRunRow ? JSON.parse(lastRunRow.value) : null;
        if (lastRunDate !== todayStr) {
          logger.info(`Catch-up: last notification run was "${lastRunDate}", running missed check now`);
          await withLock("notifications", async () => {
            await notificationService.checkAndCreateNotifications();
            const relationshipService = new PatientRelationshipService();
            await relationshipService.checkAndTransitionAdults();
            // Record today's run
            if (lastRunRow) {
              await lastRunRow.update({ value: JSON.stringify(todayStr) });
            } else {
              await Settings.create({ key: "notification.lastRunDate", value: JSON.stringify(todayStr), category: "notification" });
            }
            logger.info("Catch-up notification check completed");
          });
        }
      } catch (catchUpErr) {
        logger.error({ message: "Catch-up notification check failed", error: catchUpErr.message });
      }

      const notificationRule = new schedule.RecurrenceRule();
      notificationRule.hour = 8;
      notificationRule.minute = 0;
      schedule.scheduleJob(notificationRule, async () => {
        logger.info("Running notification check...");
        try {
          await withLock("notifications", async () => {
            await notificationService.checkAndCreateNotifications();
            const relationshipService = new PatientRelationshipService();
            await relationshipService.checkAndTransitionAdults();
            // Record today's run for catch-up logic
            const { Settings } = require("./models");
            const todayStr = new Date().toISOString().split("T")[0];
            const existing = await Settings.findOne({ where: { key: "notification.lastRunDate" } });
            if (existing) {
              await existing.update({ value: JSON.stringify(todayStr) });
            } else {
              await Settings.create({ key: "notification.lastRunDate", value: JSON.stringify(todayStr), category: "notification" });
            }
            logger.info("Notification check completed");
          });
        } catch (error) {
          logger.error({ message: "Notification check failed", error: error.message });
        }
      });

      const noShowRule = new schedule.RecurrenceRule();
      noShowRule.minute = new schedule.Range(0, 59, 5);
      schedule.scheduleJob(noShowRule, async () => {
        try {
          await withLock("no-show", async () => {
            await notificationService.markNoShowAppointments();
          });
        } catch (error) {
          logger.error({ message: "No-show check failed", error: error.message });
        }
      });
    }

    const host = config.server.isDev ? "localhost" : "127.0.0.1";
    const server = app.listen(config.server.port, host, () => {
      logger.info(`Server running on ${host}:${config.server.port} in ${config.server.nodeEnv} mode`);
    });

    // Start Telegram bot polling (Layer 2 of message cascade)
    if (config.telegram.botToken && config.telegram.pollingEnabled) {
      telegramBot = new TelegramBotService();
      telegramBot.startPolling();
    }

    const gracefulShutdown = async () => {
      logger.info("Shutting down gracefully...");
      if (telegramBot) {
        telegramBot.stopPolling();
      }
      const forceExitTimer = setTimeout(() => {
        logger.error("Forced shutdown after timeout");
        process.exit(1);
      }, 10000);
      server.close(async () => {
        clearTimeout(forceExitTimer);
        await closeDatabase();
        schedule.gracefulShutdown();
        process.exit(0);
      });
    };

    process.on("SIGTERM", gracefulShutdown);
    process.on("SIGINT", gracefulShutdown);

    return server;
  } catch (error) {
    logger.error({ message: "Failed to start server", error: error.message, stack: error.stack });
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = { startServer, rescheduleBackup };
