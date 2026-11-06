export type Topic = { id: string; title: string; summary: string; youtube: string };
export type Unit = { id: string; title: string; topics: Topic[] };
export type Question = { id: string; q: string; options: string[]; answer: number; explanation: string };
export type Course = {
  id: string; title: string; description: string; slideText: string;
  units: Unit[]; quiz: Question[]; updatedAt: number;
};
