import { LocalizedText } from './common.model';

export type TimelineType = 'EXPERIENCE' | 'EDUCATION';

export interface TimelineItemRequest {
  type: TimelineType;
  role: LocalizedText;
  organization: LocalizedText;
  description: LocalizedText;
  startDate: number;
  endDate: number | null;
  current: boolean;
  position: number;
}

export interface TimelineItem extends TimelineItemRequest {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface TimelinePublicItem {
  id: string;
  type: TimelineType;
  role: string;
  organization: string;
  description: string;
  startDate: number;
  endDate: number | null;
  current: boolean;
  position: number;
}
