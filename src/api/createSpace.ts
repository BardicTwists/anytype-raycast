import { apiFetch } from "../utils/api";
import { API_URL } from "../utils/constants";

export async function createSpace(objectData: { name: string }): Promise<void> {
  const url = `${API_URL}/spaces`;

  await apiFetch(url, {
    method: "POST",
    body: JSON.stringify({ name: objectData.name }),
  });
}
