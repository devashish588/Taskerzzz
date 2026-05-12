const paginate = (page = 1, limit = 20) => {
  const p = Math.max(1, parseInt(page) || 1);
  const l = Math.min(100, Math.max(1, parseInt(limit) || 20));
  return {
    skip: (p - 1) * l,
    take: l,
    page: p,
    limit: l,
  };
};

const paginatedResponse = (data, total, page, limit) => {
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    },
  };
};

module.exports = { paginate, paginatedResponse };
