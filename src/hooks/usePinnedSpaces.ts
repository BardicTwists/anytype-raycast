import { useCachedPromise } from "@raycast/utils";
import { getSpace } from "../api/getSpace";
import { localStorageKeys } from "../utils/constant";
import { getPinned, removePinned } from "../utils/storage";

export function usePinnedSpaces() {
  const { data, error, isLoading, mutate } = useCachedPromise(
    async () => {
      const pinnedSpaces = await getPinned(localStorageKeys.suffixForSpaces);
      const spaces = await Promise.all(
        pinnedSpaces.map(async (pinned) => {
          try {
            const response = await getSpace(pinned.spaceId);
            return response.space;
          } catch (error) {
            const typedError = error as Error & { status?: number };
            if (typedError.status === 404) {
              await removePinned(pinned.spaceId, pinned.objectId, pinned.spaceId);
            }
            return null;
          }
        }),
      );
      return spaces.filter((space) => space !== null);
    },
    [],
    {
      keepPreviousData: true,
      initialData: [],
    },
  );

  return {
    pinnedSpaces: data,
    pinnedSpacesError: error,
    isLoadingPinnedSpaces: isLoading,
    mutatePinnedSpaces: mutate,
  };
}
