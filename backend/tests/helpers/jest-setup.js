process.env.NODE_ENV = "test";
process.env.DB_STORAGE = ":memory:";
process.env.DB_MIGRATE = "sync";
process.env.JWT_SECRET = "test-secret";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
process.env.BCRYPT_ROUNDS = "4";
// Use per-worker dirs so parallel test workers don't clobber each other's
// uploads/backups (BackupService.restoreBackup swaps the uploads dir and
// copies database files, which breaks other workers sharing the same path).
const workerId = process.env.JEST_WORKER_ID || "1";
process.env.UPLOAD_DIR = `./test-uploads-${workerId}`;
process.env.BACKUP_DIR = `./test-backups-${workerId}`;
process.env.LOG_DIR = `./test-logs-${workerId}`;
