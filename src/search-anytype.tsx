import { getPreferenceValues, Icon, Image, List, showToast, Toast } from "@raycast/api";
import { MutatePromise } from "@raycast/utils";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import EmptyView from "./components/EmptyView";
import EnsureAuthenticated from "./components/EnsureAuthenticated";
import ObjectListItem from "./components/ObjectListItem";
import { addPinnedObject, removePinnedObject } from "./helpers/localStorageHelper";
import { Member, SpaceObject, Type } from "./helpers/schemas";
import { getDateLabel, getShortDateLabel, pluralize } from "./helpers/strings";
import { getAllTypesFromSpaces } from "./helpers/types";
import { useGlobalSearch } from "./hooks/useGlobalSearch";
import { usePinnedObjects } from "./hooks/usePinnedObjects";
import { useSpaces } from "./hooks/useSpaces";

const searchBarPlaceholder = "Globally search objects across spaces...";

export default function Command() {
  return (
    <EnsureAuthenticated placeholder={searchBarPlaceholder} viewType="list">
      <Search />
    </EnsureAuthenticated>
  );
}

function Search() {
  const [searchText, setSearchText] = useState("");
  const [objectTypes, setObjectTypes] = useState<string[]>([]);
  const [spaceIcons, setSpaceIcons] = useState<Map<string, string>>(new Map());
  const [filterType, setFilterType] = useState("all");
  const [uniqueKeysForPages, setUniqueKeysForPages] = useState<string[]>([]);
  const [uniqueKeysForTasks, setUniqueKeysForTasks] = useState<string[]>([]);
  const [pinnedObjects, setPinnedObjects] = useState<SpaceObject[]>([]);

  const { objects, objectsError, isLoadingObjects, mutateObjects, objectsPagination } = useGlobalSearch(
    searchText,
    objectTypes,
  );
  const { spaces, spacesError, isLoadingSpaces } = useSpaces();
  const { pinnedObjects: fetchedPinnedObjects, isLoadingPinnedObjects, mutatePinnedObjects } = usePinnedObjects();
  const viewType = filterType === "all" ? "object" : filterType.replace(/s$/, "");
  const excludedKeysForPages = new Set([
    // not shown anywhere
    "ot-audio",
    "ot-chat",
    "ot-file",
    "ot-image",
    "ot-objectType",
    "ot-tag",
    "ot-template",
    "ot-video",

    // shown in other views
    "ot-set",
    "ot-collection",
    "ot-bookmark",
    "ot-participant",
    ...uniqueKeysForTasks,
  ]);

  useEffect(() => {
    if (spaces) {
      const spaceIconMap = new Map(spaces.map((space) => [space.id, space.icon]));
      setSpaceIcons(spaceIconMap);
    }
  }, [spaces]);

  // Fetch unique keys for pages view
  useEffect(() => {
    const fetchTypesForPages = async () => {
      if (spaces) {
        const allTypes = await getAllTypesFromSpaces(spaces);
        const uniqueKeysSet = new Set(
          allTypes.map((type) => type.unique_key).filter((key) => !excludedKeysForPages.has(key)),
        );
        setUniqueKeysForPages(Array.from(uniqueKeysSet));
      }
    };

    fetchTypesForPages();
  }, [spaces]);

  // Fetch unique keys for tasks view
  useEffect(() => {
    const fetchTypesForTasks = async () => {
      if (spaces) {
        const tasksTypes = await getAllTypesFromSpaces(spaces);
        const uniqueKeysSet = new Set(
          tasksTypes.filter((type) => type.recommended_layout === "todo").map((type) => type.unique_key),
        );
        setUniqueKeysForTasks(Array.from(uniqueKeysSet));
      }
    };
    fetchTypesForTasks();
  }, [spaces]);

  useEffect(() => {
    const objectTypeMap: Record<string, string[]> = {
      all: [],
      pages: uniqueKeysForPages,
      tasks: uniqueKeysForTasks,
      lists: ["ot-set", "ot-collection"],
      bookmarks: ["ot-bookmark"],
      members: ["ot-participant"],
    };

    setObjectTypes(objectTypeMap[filterType] || []);
  }, [filterType]);

  useEffect(() => {
    if (objectsError || spacesError) {
      showToast(Toast.Style.Failure, "Failed to fetch latest data", (objectsError || spacesError)?.message);
    }
  }, [objectsError, spacesError]);

  useEffect(() => {
    if (fetchedPinnedObjects) {
      setPinnedObjects(fetchedPinnedObjects);
    }
  }, [fetchedPinnedObjects]);

  const togglePin = async (spaceId: string, objectId: string) => {
    if (pinnedObjects.some((obj) => obj.space_id === spaceId && obj.id === objectId)) {
      await removePinnedObject(spaceId, objectId);
    } else {
      await addPinnedObject(spaceId, objectId);
    }
    mutatePinnedObjects();
  };

  const processObject = (object: SpaceObject, isPinned: boolean) => {
    const spaceIcon = spaceIcons.get(object.space_id);
    const dateToSortAfter = getPreferenceValues().sort;
    const date = object.details.find((detail) => detail.id === dateToSortAfter)?.details[dateToSortAfter] as string;
    const hasValidDate = date && new Date(date).getTime() !== 0;

    return {
      key: object.id,
      spaceId: object.space_id,
      objectId: object.id,
      icon: {
        source: object.icon,
        mask:
          (object.layout === "participant" || object.layout === "profile") && object.icon != Icon.Document
            ? Image.Mask.Circle
            : Image.Mask.RoundedRectangle,
      },
      title: object.name,
      subtitle: {
        value: object.type,
        tooltip: `Type: ${object.type}`,
      },
      accessories: [
        {
          date: hasValidDate ? new Date(date) : undefined,
          tooltip: hasValidDate
            ? `${getDateLabel()}: ${format(new Date(date), "EEEE d MMMM yyyy 'at' HH:mm")}`
            : `Never ${getShortDateLabel()}`,
          text: hasValidDate ? undefined : "—",
        },
        ...(spaceIcon
          ? [
              {
                icon: {
                  source: spaceIcon,
                  mask: Image.Mask.RoundedRectangle,
                },
                tooltip: `Space: ${spaces?.find((space) => space.id === object.space_id)?.name}`,
              },
            ]
          : []),
      ],
      isPinned,
    };
  };

  // Filter pinned objects by search term
  const filterObjectsBySearchTerm = (objects: SpaceObject[], searchTerm: string) => {
    return objects.filter((object) => {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      return (
        object.name.toLowerCase().includes(lowerCaseSearchTerm) ||
        object.snippet.toLowerCase().includes(lowerCaseSearchTerm)
      );
    });
  };

  const processedPinnedObjects = pinnedObjects
    .filter((object) => objectTypes.length === 0 || objectTypes.includes(object.type))
    .map((object) => processObject(object, true));

  const processedRegularObjects = objects
    .filter((object) => !pinnedObjects.some((pinned) => pinned.id === object.id && pinned.space_id === object.space_id))
    .map((object) => processObject(object, false));

  return (
    <List
      isLoading={isLoadingSpaces || isLoadingPinnedObjects || isLoadingObjects}
      onSearchTextChange={setSearchText}
      searchBarPlaceholder={searchBarPlaceholder}
      pagination={objectsPagination}
      throttle={true}
      searchBarAccessory={
        <List.Dropdown tooltip="Filter by kind or space" onChange={(newValue) => setFilterType(newValue)}>
          <List.Dropdown.Item title="All" value="all" icon={Icon.MagnifyingGlass} />
          <List.Dropdown.Item title="Pages" value="pages" icon={Icon.Document} />
          <List.Dropdown.Item title="Tasks" value="tasks" icon={Icon.CheckCircle} />
          <List.Dropdown.Item title="Lists" value="lists" icon={Icon.List} />
          <List.Dropdown.Item title="Bookmarks" value="bookmarks" icon={Icon.Bookmark} />
          <List.Dropdown.Item title="Members" value="members" icon={Icon.PersonCircle} />
        </List.Dropdown>
      }
    >
      {processedPinnedObjects.length > 0 && (
        <List.Section
          title="Pinned"
          subtitle={`${pluralize(processedPinnedObjects.length, viewType, { withNumber: true })}`}
        >
          {processedPinnedObjects.map((object) => (
            <ObjectListItem
              key={object.key}
              spaceId={object.spaceId}
              objectId={object.objectId}
              icon={object.icon}
              title={object.title}
              subtitle={object.subtitle}
              accessories={object.accessories}
              mutate={[mutateObjects, mutatePinnedObjects as MutatePromise<SpaceObject[] | Type[] | Member[]>]}
              viewType={filterType}
              isPinned={object.isPinned}
              togglePin={togglePin}
            />
          ))}
        </List.Section>
      )}
      {processedRegularObjects.length > 0 ? (
        <List.Section
          title={searchText ? "Search Results" : `${getShortDateLabel()} Recently`}
          subtitle={`${pluralize(processedRegularObjects.length, viewType, { withNumber: true })}`}
        >
          {processedRegularObjects.map((object) => (
            <ObjectListItem
              key={object.key}
              spaceId={object.spaceId}
              objectId={object.objectId}
              icon={object.icon}
              title={object.title}
              subtitle={object.subtitle}
              accessories={object.accessories}
              mutate={[mutateObjects, mutatePinnedObjects as MutatePromise<SpaceObject[] | Type[] | Member[]>]}
              viewType={filterType}
              isPinned={object.isPinned}
              togglePin={togglePin}
            />
          ))}
        </List.Section>
      ) : (
        <EmptyView title="No Objects Found" />
      )}
    </List>
  );
}
