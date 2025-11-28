import type { Module } from '@/src/constants/types/modules';

export interface Skill {
  criterion_id: string;
  criterion_name: string;
  average_score: number;
}

export type ModuleType = Module;
