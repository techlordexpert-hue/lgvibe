import { store } from "./redis";
import { seedCourses } from "./seed";
import type { Course } from "./types";

const KEY = "lgvibe:courses";

export async function loadCourses(): Promise<Course[]> {
  const existing = await store.get<Course[]>(KEY);
  if (existing) return existing;
  const seeded = seedCourses();
  await store.set(KEY, seeded);
  return seeded;
}
export async function saveCourses(list: Course[]): Promise<void> { await store.set(KEY, list); }
