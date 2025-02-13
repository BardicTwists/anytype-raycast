import { Icon, Image, List, showToast, Toast } from "@raycast/api";
import { MutatePromise } from "@raycast/utils";
import { useEffect, useState } from "react";
import { localStorageKeys } from "../helpers/constants";
import { processObject } from "../helpers/object";
import { Member, SpaceObject, Type } from "../helpers/schemas";
import { pluralize } from "../helpers/strings";
import { useMembers } from "../hooks/useMembers";
import { usePinnedMembers, usePinnedObjects, usePinnedTypes } from "../hooks/usePinnedObjects";
import { useSearch } from "../hooks/useSearch";
import { useTypes } from "../hooks/useTypes";
import EmptyView from "./EmptyView";
import ObjectListItem from "./ObjectListItem";

type ObjectListProps = {
  spaceId: string;
};

export const CurrentView = {
  objects: "objects",
  types: "types",
  members: "members",
} as const;

export default function ObjectList({ spaceId }: ObjectListProps) {
  const [currentView, setCurrentView] = useState<keyof typeof CurrentView>(CurrentView.objects);
  const [searchText, setSearchText] = useState("");

  const { objects, objectsError, isLoadingObjects, mutateObjects, objectsPagination } = useSearch(
    spaceId,
    searchText,
    [],
  );
  const { types, typesError, isLoadingTypes, mutateTypes, typesPagination } = useTypes(spaceId);
  const { members, membersError, isLoadingMembers, mutateMembers, membersPagination } = useMembers(spaceId);
  const { pinnedObjects, pinnedObjectsError, isLoadingPinnedObjects, mutatePinnedObjects } = usePinnedObjects(
    localStorageKeys.suffixForViewsPerSpace(spaceId, CurrentView.objects),
  );
  const { pinnedTypes, pinnedTypesError, isLoadingPinnedTypes, mutatePinnedTypes } = usePinnedTypes(
    localStorageKeys.suffixForViewsPerSpace(spaceId, CurrentView.types),
  );
  const { pinnedMembers, pinnedMembersError, isLoadingPinnedMembers, mutatePinnedMembers } = usePinnedMembers(
    localStorageKeys.suffixForViewsPerSpace(spaceId, CurrentView.members),
  );
  const [pagination, setPagination] = useState(objectsPagination);

  useEffect(() => {
    const newPagination = {
      objects: objectsPagination,
      types: typesPagination,
      members: membersPagination,
    }[currentView];
    setPagination(newPagination);
  }, [currentView, objects, types, members]);

  useEffect(() => {
    if (objectsError || typesError || membersError) {
      showToast(
        Toast.Style.Failure,
        "Failed to fetch latest data",
        objectsError?.message || typesError?.message || membersError?.message,
      );
    }
  }, [objectsError, typesError, membersError]);

  useEffect(() => {
    if (pinnedObjectsError || pinnedTypesError || pinnedMembersError) {
      showToast(
        Toast.Style.Failure,
        "Failed to fetch pinned data",
        pinnedObjectsError?.message || pinnedTypesError?.message || pinnedMembersError?.message,
      );
    }
  }, [pinnedObjectsError, pinnedTypesError, pinnedMembersError]);

  const filterItems = <T extends { name: string }>(items: T[], searchText: string): T[] => {
    return items?.filter((item) => item.name.toLowerCase().includes(searchText.toLowerCase()));
  };

  const formatRole = (role: string) => {
    return role.replace("Reader", "Viewer").replace("Writer", "Editor");
  };

  const processType = (type: Type, isPinned: boolean) => {
    return {
      key: type.id,
      spaceId: spaceId,
      id: type.id,
      icon: type.icon,
      title: type.name,
      subtitle: { value: "", tooltip: "" },
      accessories: [],
      mutate: [mutateTypes, mutatePinnedTypes as MutatePromise<SpaceObject[] | Type[] | Member[]>],
      layout: "",
      isPinned,
    };
  };

  const processMember = (member: Member, isPinned: boolean) => {
    return {
      key: member.id,
      spaceId: spaceId,
      id: member.id,
      icon: { source: member.icon, mask: Image.Mask.Circle },
      title: member.name,
      subtitle: { value: member.global_name, tooltip: `Global Name: ${member.global_name}` },
      accessories: [
        {
          value: formatRole(member.role),
          tooltip: `Role: ${formatRole(member.role)}`,
        },
      ],
      mutate: [mutateMembers, mutatePinnedMembers as MutatePromise<SpaceObject[] | Type[] | Member[]>],
      layout: "",
      isPinned,
    };
  };

  const getCurrentItems = () => {
    switch (currentView) {
      case "objects": {
        const processedPinned = pinnedObjects?.length
          ? pinnedObjects
              .filter((object) => filterItems([object], searchText).length > 0)
              .map((object) => processObject(object, true, mutateObjects, mutatePinnedObjects))
          : [];

        const processedRegular = objects
          .filter(
            (object) =>
              !pinnedObjects?.some((pinned) => pinned.id === object.id && pinned.space_id === object.space_id),
          )
          .map((object) => processObject(object, false, mutateObjects, mutatePinnedObjects));

        return { processedPinned, processedRegular };
      }

      case "types": {
        const processedPinned = pinnedTypes?.length
          ? pinnedTypes
              .filter((type) => filterItems([type], searchText).length > 0)
              .map((type) => processType(type, true))
          : [];

        const processedRegular = types
          .filter((type) => !pinnedTypes?.some((pinned) => pinned.id === type.id))
          .filter((type) => filterItems([type], searchText).length > 0)
          .map((type) => processType(type, false));

        return { processedPinned, processedRegular };
      }

      case "members": {
        const processedPinned = pinnedMembers?.length
          ? pinnedMembers
              .filter((member) => filterItems([member], searchText).length > 0)
              .map((member) => processMember(member, true))
          : [];

        const processedRegular = members
          .filter((member) => !pinnedMembers?.some((pinned) => pinned.id === member.id))
          .filter((member) => filterItems([member], searchText).length > 0)
          .map((member) => processMember(member, false));

        return { processedPinned, processedRegular };
      }

      default:
        return {
          processedPinned: [],
          processedRegular: [],
        };
    }
  };

  const { processedPinned, processedRegular } = getCurrentItems();

  return (
    <List
      isLoading={
        isLoadingObjects ||
        isLoadingTypes ||
        isLoadingMembers ||
        isLoadingPinnedObjects ||
        isLoadingPinnedTypes ||
        isLoadingPinnedMembers
      }
      onSearchTextChange={setSearchText}
      searchBarPlaceholder={`Search ${currentView}...`}
      searchBarAccessory={
        <List.Dropdown
          tooltip="Choose View"
          onChange={(value) => setCurrentView(value as "objects" | "types" | "members")}
        >
          <List.Dropdown.Item title="Objects" value="objects" icon={Icon.Document} />
          <List.Dropdown.Item title="Types" value="types" icon={Icon.Lowercase} />
          <List.Dropdown.Item title="Members" value="members" icon={Icon.PersonCircle} />
        </List.Dropdown>
      }
      pagination={pagination}
      throttle={true}
    >
      {processedPinned && processedPinned.length > 0 && (
        <List.Section
          title="Pinned"
          subtitle={`${pluralize(processedPinned.length, currentView.slice(0, -1), { withNumber: true })}`}
        >
          {processedPinned.map((object) => (
            <ObjectListItem
              key={object.key}
              spaceId={object.spaceId}
              objectId={object.id}
              icon={object.icon}
              title={object.title}
              subtitle={object.subtitle}
              accessories={object.accessories}
              mutate={object.mutate}
              layout={object.layout}
              viewType={currentView}
              isGlobalSearch={false}
              isNoPinView={false}
              isPinned={object.isPinned}
            />
          ))}
        </List.Section>
      )}
      {processedRegular && processedRegular.length > 0 ? (
        <List.Section
          title={searchText ? "Search Results" : `All ${currentView.charAt(0).toUpperCase() + currentView.slice(1)}`}
          subtitle={`${pluralize(processedRegular.length, currentView.slice(0, -1), { withNumber: true })}`}
        >
          {processedRegular.map((object) => (
            <ObjectListItem
              key={object.key}
              spaceId={object.spaceId}
              objectId={object.id}
              icon={object.icon}
              title={object.title}
              subtitle={object.subtitle}
              accessories={object.accessories}
              mutate={object.mutate}
              layout={object.layout}
              viewType={currentView}
              isGlobalSearch={false}
              isNoPinView={false}
              isPinned={object.isPinned}
            />
          ))}
        </List.Section>
      ) : (
        <EmptyView title={`No ${currentView.charAt(0).toUpperCase() + currentView.slice(1)} Found`} />
      )}
    </List>
  );
}
