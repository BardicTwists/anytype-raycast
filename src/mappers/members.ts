import { getCustomIcon, getFile } from "../helpers/icon";
import { DisplayMember, Member } from "../helpers/schemas";

/**
 * Map raw `Member` objects from the API into display-ready data (e.g., icon).
 * @param members The raw `Member` objects from the API.
 * @returns The display-ready `Member` objects.
 */
export async function mapMembers(members: Member[]): Promise<DisplayMember[]> {
  return Promise.all(
    members.map(async (member) => {
      return mapMember(member);
    }),
  );
}

/**
 * Map a raw `Member` object from the API into display-ready data (e.g., icon).
 * @param member The raw `Member` object from the API.
 * @returns The display-ready `Member` object.
 */
export async function mapMember(member: Member): Promise<DisplayMember> {
  const icon =
    typeof member.icon === "object" && "file" in member.icon
      ? (await getFile(member.icon.file)) || (await getCustomIcon("person-circle", "grey"))
      : await getCustomIcon("person-circle", "grey");
  return {
    ...member,
    name: member.name || "Untitled",
    icon,
  };
}
