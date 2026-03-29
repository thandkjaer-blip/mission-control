export interface PageParams {
  page: number;
  pageSize: number;
  skip: number;
}

export function parsePageParams(input: { page?: unknown; pageSize?: unknown }): PageParams {
  const page = Math.max(1, Number(input.page ?? 1) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(input.pageSize ?? 20) || 20));

  return {
    page,
    pageSize,
    skip: (page - 1) * pageSize
  };
}

export function buildPagination(page: number, pageSize: number, total: number) {
  return {
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize))
  };
}
