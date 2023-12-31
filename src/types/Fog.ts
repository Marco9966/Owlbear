import Vector2 from "../helpers/Vector2";
import { Color } from "../helpers/colors";

export type FogToolType =
  | "polygon"
  | "rectangle"
  | "brush"
  | "toggle"
  | "remove";

export type FogToolSettings = {
  type: FogToolType;
  multilayer: boolean;
  preview: boolean;
  useFogCut: boolean;
};

export type FogData = {
  points: Vector2[];
  holes: Vector2[][];
};

export type Fog = {
  color: Color;
  data: FogData;
  id: string;
  strokeWidth: number;
  type: "fog";
  visible: boolean;
};

export type FogState = Record<string, Fog>;
