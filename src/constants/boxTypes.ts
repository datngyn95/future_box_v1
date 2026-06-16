// FutureBoxes — Box Type Configuration

import { Colors } from './colors';
import { BoxTypeConfig } from '../types/box';

export const BOX_TYPE_CONFIG: Record<string, BoxTypeConfig> = {
  message: {
    type: 'message',
    label: 'Lời nhắn',
    shortLabel: 'Lời nhắn',
    color: Colors.boxType.message,
    bgColor: Colors.boxType.messageBg,
    iconName: 'chatbubble-ellipses',
    iconFamily: 'Ionicons',
    contentPlaceholder: 'Hôm nay mình cảm thấy...',
    defaultReflectionQuestion: 'Kết quả tốt chứ?',
  },
  goal: {
    type: 'goal',
    label: 'Mục tiêu',
    shortLabel: 'Mục tiêu',
    color: Colors.boxType.goal,
    bgColor: Colors.boxType.goalBg,
    iconName: 'flag',
    iconFamily: 'Ionicons',
    contentPlaceholder: 'Mục tiêu của mình là...',
    defaultReflectionQuestion: 'Bạn đã đạt mục tiêu chưa?',
  },
  memory: {
    type: 'memory',
    label: 'Kỷ niệm',
    shortLabel: 'Kỷ niệm',
    color: Colors.boxType.memory,
    bgColor: Colors.boxType.memoryBg,
    iconName: 'images',
    iconFamily: 'Ionicons',
    contentPlaceholder: 'Khoảnh khắc này thật đặc biệt vì...',
    defaultReflectionQuestion: '',
  },
  decision: {
    type: 'decision',
    label: 'Quyết định',
    shortLabel: 'Quyết định',
    color: Colors.boxType.decision,
    bgColor: Colors.boxType.decisionBg,
    iconName: 'git-branch',
    iconFamily: 'Ionicons',
    contentPlaceholder: 'Mình đã quyết định...',
    defaultReflectionQuestion: 'Quyết định đó đúng chứ?',
  },
};

export const getBoxTypeConfig = (type: string): BoxTypeConfig => {
  return BOX_TYPE_CONFIG[type] ?? BOX_TYPE_CONFIG.message;
};
