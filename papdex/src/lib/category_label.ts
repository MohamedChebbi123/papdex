import type { TFunction } from "i18next"

export function categoryLabel(t: TFunction, category: string): string {
  return t(`category.${category}`, { defaultValue: category })
}
