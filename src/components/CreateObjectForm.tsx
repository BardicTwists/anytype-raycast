import { Action, ActionPanel, Form, Icon, Image, LaunchProps, popToRoot, showToast, Toast } from "@raycast/api";
import { useForm } from "@raycast/utils";
import { useEffect, useState } from "react";
import { createObject } from "../api/createObject";
import { Space, Type } from "../utils/schemas";

export interface CreateObjectFormValues {
  space: string;
  type: string;
  name?: string;
  icon?: string;
  description?: string;
  body?: string;
  source?: string;
}

interface CreateObjectFormProps extends Partial<LaunchProps<{ draftValues: CreateObjectFormValues }>> {
  spaces: Space[];
  objectTypes: Type[];
  selectedSpace: string;
  setSelectedSpace: (spaceId: string) => void;
  isLoading: boolean;
  draftValues: CreateObjectFormValues;
}

export default function CreateObjectForm({
  spaces,
  objectTypes,
  selectedSpace,
  setSelectedSpace,
  isLoading,
  draftValues,
}: CreateObjectFormProps) {
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState(draftValues?.type || "");
  const [filteredTypes, setFilteredTypes] = useState<Type[]>([]);

  useEffect(() => {
    const disallowed = [
      "ot-audio",
      "ot-image",
      "ot-video",
      "ot-file",
      "ot-template",
      "ot-participant",
      "ot-objectType",
    ];
    setFilteredTypes(objectTypes.filter((type) => !disallowed.includes(type.unique_key)));
  }, [objectTypes]);

  const { handleSubmit } = useForm<CreateObjectFormValues>({
    initialValues: draftValues,
    onSubmit: async (values) => {
      setLoading(true);
      try {
        await showToast({ style: Toast.Style.Animated, title: "Creating object..." });

        await createObject(selectedSpace, {
          icon: values.icon || "",
          name: values.name || "",
          description: values.description || "",
          body: values.body || "",
          source: values.source || "",
          template_id: "",
          object_type_unique_key: selectedType,
        });

        await showToast(Toast.Style.Success, "Object created successfully");
        popToRoot(); // Once submitted, drafts are dropped by Raycast
      } catch (error) {
        await showToast(Toast.Style.Failure, "Failed to create object", String(error));
      } finally {
        setLoading(false);
      }
    },
    validation: {
      name: (value) => {
        // If it's not a bookmark or note, name is required
        if (!["ot-bookmark", "ot-note"].includes(selectedType) && !value) {
          return "Name is required";
        }
      },
      icon: (value) => {
        if (value && value.length > 2) {
          return "Icon must be a single character";
        }
      },
      source: (value) => {
        // Bookmarks specifically require a Source
        if (selectedType === "ot-bookmark" && !value) {
          return "Source is required for Bookmarks";
        }
      },
    },
  });

  return (
    <Form
      isLoading={loading || isLoading}
      enableDrafts
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Create Object" icon={Icon.Plus} onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.Dropdown id="space" title="Space" value={selectedSpace} onChange={setSelectedSpace}>
        {spaces?.map((space) => (
          <Form.Dropdown.Item
            key={space.id}
            value={space.id}
            title={space.name}
            icon={{ source: space.icon, mask: Image.Mask.RoundedRectangle }}
          />
        ))}
      </Form.Dropdown>

      <Form.Dropdown id="type" title="Type" value={selectedType} onChange={setSelectedType}>
        {filteredTypes.map((type) => (
          <Form.Dropdown.Item key={type.unique_key} value={type.unique_key} title={type.name} icon={type.icon} />
        ))}
      </Form.Dropdown>

      {selectedType === "ot-bookmark" ? (
        <Form.TextField
          id="source"
          title="Source"
          placeholder="Enter a Source ..."
          defaultValue={draftValues?.source}
        />
      ) : (
        <>
          {!["ot-note"].includes(selectedType) && (
            <Form.TextField
              id="name"
              title="Name"
              placeholder="Enter an Object Name ..."
              defaultValue={draftValues?.name}
            />
          )}
          {!["ot-task", "ot-note"].includes(selectedType) && (
            <Form.TextField
              id="icon"
              title="Icon"
              placeholder="Enter a single Icon ..."
              defaultValue={draftValues?.icon}
            />
          )}
          <Form.TextField
            id="description"
            title="Description"
            placeholder="Enter a Description ..."
            defaultValue={draftValues?.description}
          />
          {!["ot-set", "ot-collection"].includes(selectedType) && (
            <Form.TextArea id="body" title="Body" placeholder="Enter a Body ..." defaultValue={draftValues?.body} />
          )}
        </>
      )}
    </Form>
  );
}
