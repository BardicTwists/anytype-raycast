import { apiFetch } from "../utils/api";
import { apiEndpoints } from "../utils/constants";
import { SpaceObject, PaginatedResponse } from "../utils/schemas";
import { transformObjects } from "../utils/helpers";

export async function search(
  query: string,
  types: string[],
  options: { offset: number; limit: number },
): Promise<PaginatedResponse<SpaceObject>> {
  const { url, method } = apiEndpoints.search(query, types, options);
  const response = await apiFetch<PaginatedResponse<SpaceObject>>(url, { method: method });

  return {
    data: response.data ? await transformObjects(response.data) : [],
    pagination: response.pagination,
  };
}
