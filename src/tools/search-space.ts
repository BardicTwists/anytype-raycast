import { search } from "../api/search";
import { apiLimit } from "../utils/constant";

type Input = {
  /**
   * The unique identifier of the space to search within.
   * This value can be obtained from the `getSpaces` tool.
   */
  spaceId: string;

  /**
   * The search query for the title of the page.
   * Note: Only plain text is supported; operators are not allowed.
   */
  query: string;

  /**
   * The types of objects to search for, identified by their id or unique_key.
   * This value can be obtained from the `getTypes` tool.
   * If no types are specified, the search will include all types of objects
   * Default value is an empty array.
   */
  types?: string[];

  /**
   * Optional sorting options for the search results
   * (e.g., sorting direction and field).
   */
  sort?: {
    /**
     * The sorting direction for the search results.
     * This value can be either "asc" (ascending) or "desc" (descending).
     * Default value is "desc".
     */
    direction?: "asc" | "desc";

    /**
     * The sorting field for the search results.
     * This value can be "last_modified_date", "last_opened_date", or "created_date".
     * Default value is "last_modified_date".
     */
    timestamp?: "last_modified_date" | "last_opened_date" | "created_date";
  };
};

/**
 * Perform a search for objects within a specific space.
 * This function queries the specified space and returns a list of objects
 * that match the search criteria.
 * For empty search queries, objects are sorted by creation date in descending order.
 */
export default async function tool({ spaceId, query, types, sort }: Input) {
  types = types ?? [];
  const sortOptions = {
    direction: sort?.direction ?? "desc",
    timestamp: sort?.timestamp ?? "last_modified_date",
  };

  const { data, pagination } = await search(
    spaceId,
    { query, types, sort: sortOptions },
    { offset: 0, limit: apiLimit },
  );
  const results = data.map(({ object, name, id, snippet, icon }) => {
    const result = { object, name, id, snippet };
    if (typeof icon === "object" && "emoji" in icon) {
      return { ...result, icon };
    }
    return result;
  });

  return {
    results,
    pagination,
  };
}
