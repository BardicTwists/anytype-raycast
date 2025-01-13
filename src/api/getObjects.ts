import { apiFetch } from "../utils/api";
import { apiEndpoints } from "../utils/constants";
import { mapObjects } from "../utils/mappers/objects";
import { PaginatedResponse, Pagination, SpaceObject } from "../utils/schemas";

export async function getObjects(
  spaceId: string,
  options: { offset: number; limit: number },
): Promise<{
  objects: SpaceObject[];
  pagination: Pagination;
}> {
  const { url, method } = apiEndpoints.getObjects(spaceId, options);
  const response = await apiFetch<PaginatedResponse<SpaceObject>>(url, { method: method });

  return {
    objects: response.data ? await mapObjects(response.data) : [],
    pagination: response.pagination,
  };
}
