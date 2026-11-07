import { DateTime } from "luxon";

const key = (topicId: number) => `topic-last-visited.${topicId}`;

export function lastVisited(topicId: number): DateTime | null {
  const value = localStorage.getItem(key(topicId));
  return value ? DateTime.fromISO(value) : null;
}

export function markVisited(topicId: number): void {
  localStorage.setItem(key(topicId), new Date().toISOString());
}
