import type { DropKind } from "../entities";

export type PowerupDef = {
  kind: DropKind;
  weight: number;
  duration: number;
  title: string;
  desc: string;
};

/**
 * Реестр бонусов: добавить новый — одна запись здесь + отрисовка (dropFolder уже общий).
 * weight — относительная частота выпадения.
 */
export const POWERUP_DEFS: Record<DropKind, PowerupDef> = {
  multiball: { kind: "multiball", weight: 26, duration: 0, title: "Папка", desc: "Мультимяч: +2 мяча" },
  widen: { kind: "widen", weight: 24, duration: 15, title: "Фото", desc: "Ракетка шире" },
  guard: { kind: "guard", weight: 14, duration: 8, title: "Часы", desc: "Широкая страховка" },
  slow: { kind: "slow", weight: 12, duration: 3, title: "Кофе", desc: "Замедление 3 с" },
  cut: { kind: "cut", weight: 12, duration: 0, title: "Ножницы", desc: "−1 урон всем прочным" },
  catch: { kind: "catch", weight: 6, duration: 0, title: "Зеркальце", desc: "Захват мяча" },
  curse: { kind: "curse", weight: 3, duration: 8, title: "Ухмылка", desc: "Ракетка уже (злое)" },
  life: { kind: "life", weight: 3, duration: 0, title: "Часы", desc: "+1 жизнь" },
};

export const POWERUP_ORDER: DropKind[] = [
  "multiball",
  "widen",
  "slow",
  "cut",
  "guard",
  "life",
  "catch",
  "curse",
];

/** Выбрать тип дропа взвешенным случайным. */
export function rollDropKind(bossAlive: boolean, chapterIndex: number, rand = Math.random): DropKind {
  const entries = POWERUP_ORDER.map((k) => {
    let w = POWERUP_DEFS[k].weight;
    if (k === "curse") w *= 1 + chapterIndex * 0.5;
    if (k === "life" && bossAlive) w *= 2;
    return { k, w };
  });
  const total = entries.reduce((s, e) => s + e.w, 0);
  let r = rand() * total;
  for (const e of entries) {
    r -= e.w;
    if (r <= 0) return e.k;
  }
  return "multiball";
}
