/** Проверяет, похожа ли строка на MongoDB ObjectId. */
export function isMongoObjectId(value: string): boolean {
  return /^[a-f\d]{24}$/i.test(value);
}
