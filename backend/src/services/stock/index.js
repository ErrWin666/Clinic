const StockMovementService = require("./StockMovementService");
const StockIntegrationService = require("./StockIntegrationService");
const StockAnalyticsService = require("./StockAnalyticsService");

const movementMethods = Object.getOwnPropertyNames(StockMovementService.prototype)
  .filter((m) => m !== "constructor" && !m.startsWith("_"));
const integrationMethods = Object.getOwnPropertyNames(StockIntegrationService.prototype)
  .filter((m) => m !== "constructor" && !m.startsWith("_"));
const analyticsMethods = Object.getOwnPropertyNames(StockAnalyticsService.prototype)
  .filter((m) => m !== "constructor" && !m.startsWith("_"));

// Compose a single StockService that delegates to all three sub-services
class StockService {
  constructor() {
    this._movementService = new StockMovementService();
    this._integrationService = new StockIntegrationService(this._movementService);
    this._analyticsService = new StockAnalyticsService();
    // Expose repository for backward compatibility (BaseService.repository)
    this.repository = this._movementService.repository;
  }
}

// Assign all methods to the composed class, delegating to the correct sub-service
for (const m of movementMethods) {
  StockService.prototype[m] = function (...args) {
    return this._movementService[m](...args);
  };
}
for (const m of integrationMethods) {
  StockService.prototype[m] = function (...args) {
    return this._integrationService[m](...args);
  };
}
for (const m of analyticsMethods) {
  StockService.prototype[m] = function (...args) {
    return this._analyticsService[m](...args);
  };
}

module.exports = StockService;
