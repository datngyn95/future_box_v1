// FutureBoxes — Core TypeScript Types

export type BoxType =
  | 'message'
  | 'goal'
  | 'memory'
  | 'decision'
  | 'secret'
  | 'challenge'
  | 'letter';
export type BoxStatus = 'locked' | 'ready_to_open' | 'opened';

export interface BoxTeaser {
  id: string;
  boxId: string;
  teaserText: string;
  unlockAt: string;
  isSystemGenerated: boolean;
  createdAt: string;
}

export interface BoxPrediction {
  id: string;
  boxId: string;
  predictionText: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Box {
  id: string;
  boxType: BoxType;
  title?: string;
  content: string;
  openingNote?: string;
  reflectionQuestion?: string;
  reflectionAnswer?: 'yes' | 'no' | null;
  reflectionNote?: string;
  reflectionRating?: number;
  reflectionUpdatedAt?: string;
  imagePath?: string;
  unlockDate: string; // ISO date string
  createdAt: string;  // ISO date string
  openedAt?: string;  // ISO date string
  notificationIdentifier?: string;
  teasers?: BoxTeaser[];
  prediction?: BoxPrediction;
  status: BoxStatus;
}

export interface BoxTypeConfig {
  type: BoxType;
  label: string;
  color: string;
  bgColor: string;
  iconName: string;
  iconFamily: 'Ionicons' | 'MaterialCommunityIcons';
  contentPlaceholder: string;
  defaultReflectionQuestion: string;
  shortLabel: string;
}
