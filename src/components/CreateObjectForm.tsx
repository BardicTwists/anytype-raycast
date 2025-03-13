import { Action, ActionPanel, Form, Icon, Image, popToRoot, showToast, Toast } from "@raycast/api";
import { useForm } from "@raycast/utils";
import { useState } from "react";
import { addObjectsToList, createObject } from "../api";
import { CreateObjectFormValues } from "../create-object";
import { DisplayObject, DisplaySpace, DisplayTemplate, DisplayType } from "../models";

interface CreateObjectFormProps {
  spaces: DisplaySpace[];
  types: DisplayType[];
  templates: DisplayTemplate[];
  lists: DisplayObject[];
  selectedSpace: string;
  setSelectedSpace: (spaceId: string) => void;
  selectedType: string;
  setSelectedType: (type: string) => void;
  selectedTemplate: string;
  setSelectedTemplate: (templateId: string) => void;
  selectedList: string;
  setSelectedList: (listId: string) => void;
  listSearchText: string;
  setListSearchText: (searchText: string) => void;
  isLoading: boolean;
  draftValues: CreateObjectFormValues;
  enableDrafts: boolean;
}

export function CreateObjectForm({
  spaces,
  types,
  templates,
  lists,
  selectedSpace,
  setSelectedSpace,
  selectedType,
  setSelectedType,
  selectedTemplate,
  setSelectedTemplate,
  selectedList,
  setSelectedList,
  listSearchText,
  setListSearchText,
  isLoading,
  draftValues,
  enableDrafts,
}: CreateObjectFormProps) {
  const [loading, setLoading] = useState(false);
  const hasSelectedSpaceAndType = selectedSpace && selectedType;
  const selectedTypeUniqueKey = types.reduce((acc, type) => (type.id === selectedType ? type.unique_key : acc), "");

  const { handleSubmit, itemProps } = useForm<CreateObjectFormValues>({
    initialValues: draftValues,
    onSubmit: async (values) => {
      setLoading(true);
      try {
        await showToast({ style: Toast.Style.Animated, title: "Creating object..." });

        const response = await createObject(selectedSpace, {
          object_type_unique_key: selectedTypeUniqueKey,
          template_id: values.template || "",
          icon: values.icon || "",
          name: values.name || "",
          description: values.description || "",
          body: values.body || "",
          source: values.source || "",
        });

        if (response.object?.id) {
          if (selectedList) {
            await addObjectsToList(selectedSpace, selectedList, [response.object.id]);
            await showToast(Toast.Style.Success, "Object created and added to collection");
          } else {
            await showToast(Toast.Style.Success, "Object created successfully");
          }
          popToRoot();
        } else {
          await showToast(Toast.Style.Failure, "Failed to create object");
        }
      } catch (error) {
        await showToast(Toast.Style.Failure, "Failed to create object", String(error));
      } finally {
        setLoading(false);
      }
    },
    validation: {
      name: (value) => {
        if (!["ot-bookmark", "ot-note"].includes(selectedTypeUniqueKey) && !value) {
          return "Name is required";
        }
      },
      icon: (value) => {
        if (value && value.length > 2) {
          return "Icon must be a single character";
        }
      },
      source: (value) => {
        if (selectedTypeUniqueKey === "ot-bookmark" && !value) {
          return "Source is required for Bookmarks";
        }
      },
    },
  });

  function getQuicklink(): { name: string; link: string } {
    const url = "raycast://extensions/any/anytype/create-object";

    const launchContext = {
      defaults: {
        space: selectedSpace,
        type: selectedType,
        list: selectedList,
        name: itemProps.name.value,
        icon: itemProps.icon.value,
        description: itemProps.description.value,
        body: itemProps.body.value,
        source: itemProps.source.value,
      },
    };

    return {
      name: `Create ${types.find((type) => type.unique_key === selectedTypeUniqueKey)?.name} in ${spaces.find((space) => space.id === selectedSpace)?.name}`,
      link: url + "?launchContext=" + encodeURIComponent(JSON.stringify(launchContext)),
    };
  }

  return (
    <Form
      navigationTitle="Create Object"
      isLoading={loading || isLoading}
      enableDrafts={enableDrafts}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Create Object" icon={Icon.Plus} onSubmit={handleSubmit} />
          {hasSelectedSpaceAndType && (
            <Action.CreateQuicklink
              title={`Create Quicklink: ${types.find((type) => type.unique_key === selectedTypeUniqueKey)?.name}`}
              quicklink={getQuicklink()}
            />
          )}
        </ActionPanel>
      }
    >
      <Form.Dropdown
        id="space"
        title="Space"
        value={selectedSpace}
        onChange={setSelectedSpace}
        storeValue={true}
        info="Select the space where the object will be created"
      >
        {spaces?.map((space) => (
          <Form.Dropdown.Item
            key={space.id}
            value={space.id}
            title={space.name}
            icon={
              typeof space.icon === "string"
                ? { source: space.icon, mask: Image.Mask.RoundedRectangle }
                : (space.icon as { source: string; tintColor?: { light: string; dark: string }; mask?: Image.Mask })
            }
          />
        ))}
      </Form.Dropdown>

      <Form.Dropdown
        id="type"
        title="Type"
        value={selectedType}
        onChange={setSelectedType}
        storeValue={true} // TODO: does not work
        info="Select the type of object to create"
      >
        {types.map((type) => (
          <Form.Dropdown.Item key={type.id} value={type.id} title={type.name} icon={type.icon} />
        ))}
      </Form.Dropdown>

      <Form.Dropdown
        id="template"
        title="Template"
        value={selectedTemplate}
        onChange={setSelectedTemplate}
        storeValue={true}
        info="Select the template to use for the object"
      >
        <Form.Dropdown.Item key="none" value="" title="No Template" icon={Icon.Dot} />
        {templates.map((template) => (
          <Form.Dropdown.Item key={template.id} value={template.id} title={template.name} icon={template.icon} />
        ))}
      </Form.Dropdown>

      <Form.Dropdown
        id="list"
        title="Collection"
        value={selectedList}
        onChange={setSelectedList}
        onSearchTextChange={setListSearchText}
        throttle={true}
        storeValue={true}
        info="Select the collection where the object will be added"
      >
        {!listSearchText && <Form.Dropdown.Item key="none" value="" title="No Collection" icon={Icon.Dot} />}
        {lists.map((list) => (
          <Form.Dropdown.Item key={list.id} value={list.id} title={list.name} icon={list.icon} />
        ))}
      </Form.Dropdown>

      <Form.Separator />

      {hasSelectedSpaceAndType && (
        <>
          {selectedTypeUniqueKey === "ot-bookmark" ? (
            <Form.TextField
              {...itemProps.source}
              title="URL"
              placeholder="Add link"
              info="Provide the source URL for the bookmark"
            />
          ) : (
            <>
              {!["ot-note"].includes(selectedTypeUniqueKey) && (
                <Form.TextField
                  {...itemProps.name}
                  title="Name"
                  placeholder="Add a name"
                  info="Enter the name of the object"
                />
              )}
              {!["ot-task", "ot-note", "ot-profile"].includes(selectedTypeUniqueKey) && (
                <Form.TextField
                  {...itemProps.icon}
                  title="Icon"
                  placeholder="Add an emoji"
                  info="Enter a single emoji character to represent the object"
                />
              )}
              <Form.TextField
                {...itemProps.description}
                title="Description"
                placeholder="Add a description"
                info="Provide a brief description of the object"
              />
              {!["ot-set", "ot-collection"].includes(selectedTypeUniqueKey) && (
                <Form.TextArea
                  {...itemProps.body}
                  title="Body"
                  placeholder="Add text in markdown"
                  info="Parses markdown to Anytype Blocks.

It supports:
- Headings, subheadings, and paragraphs
- Number, bullet, and checkbox lists
- Code blocks, blockquotes, and tables
- Text formatting: bold, italics, strikethrough, inline code, hyperlinks"
                />
              )}
            </>
          )}
        </>
      )}
    </Form>
  );
}
