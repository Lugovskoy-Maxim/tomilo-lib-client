import type { RelatedTitleRelationType } from "@/types/title";

export const relatedTitleRelationLabels: Record<RelatedTitleRelationType, string> = {
  sequel: "Сиквел",
  prequel: "Приквел",
  spin_off: "Спинофф",
  adaptation: "Адаптация",
  side_story: "Побочная история",
  alternative_story: "Альтернативная история",
  other: "Другое",
};

export function getRelatedTitleLabel(relationType: string): string {
  return relatedTitleRelationLabels[relationType as RelatedTitleRelationType] ?? relationType;
}
