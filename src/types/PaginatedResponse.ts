export interface PaginatedResponse<T> {
  data: T[];
  to: number;
  per_page: number;
  current_page: number;
  from: number;
  last_page: number;
  total: number;
}