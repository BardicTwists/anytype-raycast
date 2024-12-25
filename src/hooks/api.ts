import fetch from "node-fetch";
import { useCachedPromise } from "@raycast/utils";
import { UseCachedPromiseReturnType } from "@raycast/utils/dist/types";
import * as C from "../utils/constants";
import * as S from "../utils/schemas";
import * as H from "../utils/helpers";

/********************************
 * Spaces
 * POST /spaces
 ********************************/

export async function createSpace(objectData: { name: string }): Promise<void> {
  const response = await fetch(`${C.API_URL}/spaces`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name: objectData.name }),
  });

  if (!response.ok) {
    throw new Error(
      `Failed to create space: [${response.status}] ${response.statusText}`,
    );
  }
}

/********************************
 * SpaceObjects
 * POST /spaces/:spaceId/objects
 ********************************/

export async function createObject(
  spaceId: string,
  objectData: {
    icon: string;
    name: string;
    template_id: string;
    object_type_unique_key: string;
  },
): Promise<void> {
  const response = await fetch(`${C.API_URL}/spaces/${spaceId}/objects`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(objectData),
  });

  if (!response.ok) {
    throw new Error(
      `Failed to create object in space ${spaceId}: [${response.status}] ${response.statusText}`,
    );
  }
}

/********************************
 * Types and Templates
 * GET /spaces/:spaceId/objectTypes
 * GET /spaces/:spaceId/objectTypes/:typeId/templates
 ********************************/

export function useGetObjectTypes(spaceId: string) {
  return useCachedPromise(
    async ({ signal }) => {
      const response = await fetch(
        `${C.API_URL}/spaces/${spaceId}/objectTypes?limit=100&offset=0`,
        { signal },
      );
      if (!response.ok) {
        throw new Error(
          `Failed to fetch object types for space ${spaceId}: [${response.status}] ${response.statusText}`,
        );
      }
      const data = (await response.json()) as { objectTypes: S.ObjectType[] };
      return data.objectTypes ? H.transformObjectTypes(data.objectTypes) : [];
    },
    [spaceId],
  ) as UseCachedPromiseReturnType<S.ObjectType[], undefined>;
}

export function useGetTemplates(spaceId: string, typeId: string) {
  return useCachedPromise(
    async ({ signal }) => {
      const response = await fetch(
        `${C.API_URL}/spaces/${spaceId}/objectTypes/${typeId}/templates`,
        { signal },
      );
      if (!response.ok) {
        throw new Error(
          `Failed to fetch templates for type ${typeId} in space ${spaceId}: [${response.status}] ${response.statusText}`,
        );
      }
      const data = (await response.json()) as { templates: S.ObjectTemplate[] };
      return data.templates ? data.templates : [];
    },
    [spaceId],
    // TODO figure out cachedPromise with typeId as second dependency
    // [spaceId, typeId],
  ) as UseCachedPromiseReturnType<S.ObjectTemplate[], undefined>;
}

/********************************
 * Chat
 * GET /spaces/:spaceId/chat/messages
 * POST /spaces/:spaceId/chat/messages
 ********************************/

export function useGetChatMessages(spaceId: string) {
  return useCachedPromise(
    async ({ signal }) => {
      const response = await fetch(
        `${C.API_URL}/spaces/${spaceId}/chat/messages`,
        { signal },
      );
      if (!response.ok) {
        throw new Error(
          `Failed to fetch chat messages for space ${spaceId}: [${response.status}] ${response.statusText}`,
        );
      }
      const data = (await response.json()) as {
        chatId: string;
        messages: S.ChatMessage[];
      };
      return {
        chatId: data.chatId,
        messages: data.messages ?? [],
      };
    },
    [spaceId],
  ) as UseCachedPromiseReturnType<
    { chatId: string; messages: S.ChatMessage[] },
    undefined
  >;
}

export async function createChatMessage(
  spaceId: string,
  messageText: string,
): Promise<void> {
  const response = await fetch(`${C.API_URL}/spaces/${spaceId}/chat/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text: messageText }),
  });

  if (!response.ok) {
    throw new Error(
      `Failed to post chat message to space ${spaceId}: [${response.status}] ${response.statusText}`,
    );
  }
}
