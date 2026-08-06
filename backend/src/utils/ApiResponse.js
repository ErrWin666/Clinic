class ApiResponse {
  static success(data, message = "Operation completed successfully") {
    return { success: true, data, message };
  }

  static paginated(data, pagination, message = "Records retrieved successfully") {
    return { success: true, data, pagination, message };
  }

  static error(code, message, details = null) {
    const error = { code, message };
    if (details) error.details = details;
    return { success: false, error, message: "Operation failed" };
  }
}

module.exports = ApiResponse;
