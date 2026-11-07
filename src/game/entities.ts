import type { BrickType } from "../render/palette";

export type Ball = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  stuck: boolean;
  trail: { x: number; y: number }[];
  alive: boolean;
};

export type Brick = {
  col: number;
  row: number;
  x: number;
  y: number;
  w: number;
  h: number;
  type: BrickType;
  hp: number;
  solid: boolean; // неразрушимый
  hitFlash: number;
  alive: boolean;
};

export type DropKind =
  | "multiball"
  | "widen"
  | "slow"
  | "cut"
  | "guard"
  | "life"
  | "catch"
  | "curse";

export type Drop = {
  x: number;
  y: number;
  kind: DropKind;
  alive: boolean;
};

export type ActiveEffect = {
  kind: "widen" | "guard" | "slow" | "curse";
  timeLeft: number;
  duration: number;
};
