function parsePagination(query) {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const pageSize = Math.min(Math.max(parseInt(query.pageSize, 10) || 20, 1), 100);
  const offset = (page - 1) * pageSize;
  return { page, pageSize, offset, limit: pageSize };
}

function buildPaginationResponse(totalItems, page, pageSize) {
  return {
    totalItems,
    totalPages: Math.ceil(totalItems / pageSize),
    currentPage: page,
    pageSize,
  };
}

module.exports = { parsePagination, buildPaginationResponse };
