import { apiFetch } from "../helpers/api";
import { apiEndpoints } from "../helpers/constants";
import { CreateObjectRequest, DisplayObject, SpaceObject } from "../helpers/schemas";
import { mapObject } from "../mappers/objects";

export async function createObject(
  spaceId: string,
  objectData: CreateObjectRequest,
): Promise<{ object: DisplayObject | null }> {
  const { url, method } = apiEndpoints.createObject(spaceId);

  const response = await apiFetch<{ object: SpaceObject }>(url, {
    method: method,
    body: JSON.stringify(objectData),
  });

  return {
    object: response ? await mapObject(response.payload.object) : null,
  };
}
