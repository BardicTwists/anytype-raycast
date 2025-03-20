import { Image } from "@raycast/api";
import { ObjectIcon } from ".";

export interface CreateSpaceRequest {
  name: string;
}

export interface RawSpace {
  object: string;
  id: string;
  name: string;
  icon: ObjectIcon;
  gateway_url: string;
  network_id: string;
}

export interface Space extends Omit<RawSpace, "icon"> {
  icon: Image.ImageLike;
}
