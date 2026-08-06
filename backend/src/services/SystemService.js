const BaseService = require("./BaseService");
const config = require("../config");
const MESSAGES = require("../constants/messages");
const path = require("path");
const fs = require("fs");

class SystemService extends BaseService {
  constructor() {
    super(null);
  }

  async getDiskSpace() {
    return this.executeOperation(async () => {
      const totalSpace = 500 * 1024 * 1024 * 1024; // 500GB default assumption
      let usedSpace = 0;

      const checkDir = (dir) => {
        try {
          const items = fs.readdirSync(dir);
          for (const item of items) {
            const itemPath = path.resolve(dir, item);
            const stat = fs.statSync(itemPath);
            if (stat.isDirectory()) {
              checkDir(itemPath);
            } else {
              usedSpace += stat.size;
            }
          }
        } catch (e) {
          // skip inaccessible dirs
        }
      };

      checkDir(path.resolve(config.upload.dir));
      checkDir(path.resolve(config.backup.dir));
      checkDir(path.resolve(config.database.storage));

      const percentage = Math.round((usedSpace / totalSpace) * 100);
      let status = "ok";
      if (percentage >= 90) status = "critical";
      else if (percentage >= 70) status = "warning";

      return {
        used: usedSpace,
        total: totalSpace,
        percentage,
        status,
      };
    }, MESSAGES.SYSTEM.DISK_RETRIEVED, "SYSTEM_DISK_ERROR");
  }
}

module.exports = SystemService;
