import { mapProperty } from "../../mappers/properties";
import { Property } from "../../models";
import { apiEndpoints, apiFetch } from "../../utils";

export async function deleteProperty(spaceId: string, propertyId: string): Promise<Property | null> {
  const { url, method } = apiEndpoints.deleteProperty(spaceId, propertyId);

  const response = await apiFetch<{ property: Property }>(url, {
    method: method,
  });

  return response ? mapProperty(response.payload.property) : null;
}
