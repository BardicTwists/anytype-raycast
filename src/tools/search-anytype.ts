import { globalSearch } from "../api/globalSearch";
import { apiLimit } from "../helpers/constants";

type Input = {
  /**
   * The search query for the title of the page.
   * Note: Only plain text is supported; operators are not allowed.
   */
  query: string;

  /**
   * The types of objects to search for, identified by their id or unique_key.
   * This value can be obtained from the `getTypes` tool.
   * If no types are specified, the search will include all types of objects.
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
 * Perform a global search for objects across all spaces.
 * This function queries all available spaces and returns a list of objects
 * that match the search criteria.
 * For empty search query, most recently modified objects are returned.
 */
export default async function tool({ query, types, sort }: Input) {
  types = types ?? [];
  const sortOptions = {
    direction: sort?.direction ?? "desc",
    timestamp: sort?.timestamp ?? "last_modified_date",
  };

  const response = await globalSearch({ query, types, sort: sortOptions }, { offset: 0, limit: apiLimit });
  return response.data.map(({ object, name, id, snippet, icon }) => {
    const result = { object, name, id, snippet };
    if (icon && icon.length === 1) {
      return { ...result, icon };
    }
    return result;
  });
}
