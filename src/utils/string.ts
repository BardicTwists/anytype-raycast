import { getPreferenceValues } from "@raycast/api";
import { MemberRole } from "../models";

/**
 * Simple utility for pluralizing words.
 */
export function pluralize(
  count: number,
  noun: string,
  { suffix = "s", withNumber = false }: { suffix?: string; withNumber?: boolean } = {},
): string {
  const pluralizedNoun = `${noun}${count !== 1 ? suffix : ""}`;
  return withNumber ? `${count} ${pluralizedNoun}` : pluralizedNoun;
}

/**
 * Get the label for the date field based on the sort preference.
 */
export function getDateLabel(): string | undefined {
  const { sort } = getPreferenceValues();
  switch (sort) {
    case "created_date":
      return "Created Date";
    case "last_modified_date":
      return "Last Modified Date";
    case "last_opened_date":
      return "Last Opened Date";
    default:
      return undefined;
  }
}

/**
 * Get the short date label based on the sort preference.
 */
export function getShortDateLabel(): string {
  const { sort } = getPreferenceValues();
  switch (sort) {
    case "created_date":
      return "Created";
    case "last_modified_date":
      return "Modified";
    case "last_opened_date":
      return "Opened";
    default:
      return "Date";
  }
}

/**
 * Format the member role to readable representation.
 */
export function formatMemberRole(role: string): string {
  return role
    .replace(MemberRole.Reader, "Viewer")
    .replace(MemberRole.Writer, "Editor")
    .replace(MemberRole.Owner, "Owner")
    .replace(MemberRole.NoPermissions, "No Permissions");
}
