import { Image } from "@raycast/api";
import { ObjectIcon } from ".";

export interface RawType {
  object: string;
  id: string;
  type_key: string;
  name: string;
  icon: ObjectIcon;
  recommended_layout: string;
}

export interface Type extends Omit<RawType, "icon"> {
  icon: Image.ImageLike;
}
