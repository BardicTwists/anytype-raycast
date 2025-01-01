import { apiFetch } from "../utils/api";
import { API_URL } from "../utils/constants";

export async function createObject(
  spaceId: string,
  objectData: {
    icon: string;
    name: string;
    template_id: string;
    object_type_unique_key: string;
  },
): Promise<void> {
  const url = `${API_URL}/spaces/${spaceId}/objects`;

  await apiFetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(objectData),
  });
}
