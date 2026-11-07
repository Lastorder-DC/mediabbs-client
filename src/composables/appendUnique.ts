/**
 * Appends items whose `id` is not in the list yet. Offset paging can return an
 * item twice (new posts shift the pages; two loads may overlap).
 */
export function appendUnique<T extends { id: number }>(list: T[], items: T[]): void {
  const seen = new Set(list.map((item) => item.id));
  for (const item of items) {
    if (!seen.has(item.id)) {
      seen.add(item.id);
      list.push(item);
    }
  }
}
