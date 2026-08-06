const BaseController = require("./BaseController");
const DashboardService = require("../services/DashboardService");
const MESSAGES = require("../constants/messages");

class DashboardController extends BaseController {
  constructor() {
    super();
    this.dashboardService = new DashboardService();
  }

  async getStats(req, res, next) {
    try {
      const { startDate, endDate } = req.query || {};
      const stats = await this.dashboardService.getStats(startDate, endDate);
      return this.sendSuccess(res, stats, MESSAGES.DASHBOARD.STATS_RETRIEVED);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = DashboardController;
