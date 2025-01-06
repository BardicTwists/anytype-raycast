import { useCachedPromise } from "@raycast/utils";
import { getMembers } from "../api/getMembers";
import { useMemo } from "react";
import { API_LIMIT } from "../utils/constants";

export function useMembers(spaceId: string) {
  const { data, error, isLoading, pagination } = useCachedPromise(
    (spaceId: string) => async (options: { page: number }) => {
      const offset = options.page * API_LIMIT;
      const response = await getMembers(spaceId, { offset, limit: API_LIMIT });

      return {
        data: response.members,
        hasMore: response.pagination.has_more,
      };
    },
    [spaceId],
    {
      keepPreviousData: true,
    },
  );

  // filter empty data to prevent flickering at the bottom
  const filteredData = useMemo(() => data?.filter((member) => member) || [], [data]);

  return {
    members: filteredData,
    membersError: error,
    isLoadingMembers: isLoading,
    membersPagination: pagination,
  };
}
