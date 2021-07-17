import Konva from "konva";
import { Outline } from "./Outline";
import { TokenState } from "./TokenState";

export type TokenCategory = "character" | "vehicle" | "prop";

export type BaseToken = {
  id: string;
  name: string;
  defaultSize: number;
  defaultCategory: TokenCategory;
  defaultLabel: string;
  hideInSidebar: boolean;
  width: number;
  height: number;
  owner: string;
  created: number;
  lastModified: number;
  outline: Outline;
};

export type DefaultToken = BaseToken & {
  type: "default";
  key: string;
};

export type FileToken = BaseToken & {
  type: "file";
  file: string;
  thumbnail: string;
};

export type Token = DefaultToken | FileToken;

export type TokenMenuOptions = {
  tokenStateId: string;
  tokenImage: Konva.Node;
};

export type TokenDraggingOptions = {
  dragging: boolean;
  tokenState: TokenState;
  tokenNode: Konva.Node;
};
