import { Box } from '../types/box';
import { getBoxStatus } from '../store/boxStore';

export interface PersonalStats {
  total: number;
  lockedCount: number;
  readyCount: number;
  openedCount: number;
  goalCompleted: number;
  goalTotal: number;
  nextBox?: Box;
  reflectionNoteCount: number;
}

export function computeStats(boxes: Box[]): PersonalStats {
  return boxes.reduce<PersonalStats>(
    (stats, box) => {
      const status = getBoxStatus(box);

      if (status === 'locked') {
        stats.lockedCount += 1;
        if (
          !stats.nextBox ||
          new Date(box.unlockDate).getTime() < new Date(stats.nextBox.unlockDate).getTime()
        ) {
          stats.nextBox = box;
        }
      } else if (status === 'ready_to_open') {
        stats.readyCount += 1;
      } else {
        stats.openedCount += 1;
      }

      if (
        (box.boxType === 'goal' || box.boxType === 'challenge') &&
        status === 'opened' &&
        (box.reflectionAnswer === 'yes' || box.reflectionAnswer === 'no')
      ) {
        stats.goalTotal += 1;
        if (box.reflectionAnswer === 'yes') {
          stats.goalCompleted += 1;
        }
      }

      if (box.reflectionNote?.trim()) {
        stats.reflectionNoteCount += 1;
      }

      return stats;
    },
    {
      total: boxes.length,
      lockedCount: 0,
      readyCount: 0,
      openedCount: 0,
      goalCompleted: 0,
      goalTotal: 0,
      reflectionNoteCount: 0,
    },
  );
}
