import { Image } from "@raycast/api";
import { Property, PropertyFormat, RawProperty, Tag } from "../models";
import { colorMap } from "../utils";

export function mapProperties(properties: RawProperty[]): Property[] {
  return properties.map((property) => {
    return mapProperty(property);
  });
}

export function mapProperty(property: RawProperty): Property {
  return {
    ...property,
    name: property.name || "Untitled",
    icon: getIconForProperty(property.format),
  };
}

function getIconForProperty(format: PropertyFormat): Image.ImageLike {
  const tintColor = { light: "grey", dark: "grey" };
  switch (format) {
    case PropertyFormat.Text:
      return { source: "icons/property/text.svg", tintColor: tintColor };
    case PropertyFormat.Number:
      return { source: "icons/property/number.svg", tintColor: tintColor };
    case PropertyFormat.Select:
      return { source: "icons/property/select.svg", tintColor: tintColor };
    case PropertyFormat.MultiSelect:
      return { source: "icons/property/multiSelect.svg", tintColor: tintColor };
    case PropertyFormat.Date:
      return { source: "icons/property/date.svg", tintColor: tintColor };
    case PropertyFormat.File:
      return { source: "icons/property/file.svg", tintColor: tintColor };
    case PropertyFormat.Checkbox:
      return { source: "icons/property/checkbox.svg", tintColor: tintColor };
    case PropertyFormat.Url:
      return { source: "icons/property/url.svg", tintColor: tintColor };
    case PropertyFormat.Email:
      return { source: "icons/property/email.svg", tintColor: tintColor };
    case PropertyFormat.Phone:
      return { source: "icons/property/phone.svg", tintColor: tintColor };
    case PropertyFormat.Object:
      return { source: "icons/property/object.svg", tintColor: tintColor };
  }
}

export function mapTags(tags: Tag[]): Tag[] {
  return tags.map((tag) => {
    return mapTag(tag);
  });
}

export function mapTag(tag: Tag): Tag {
  return {
    ...tag,
    name: tag.name || "Untitled",
    color: colorMap[tag.color] || tag.color,
  };
}
