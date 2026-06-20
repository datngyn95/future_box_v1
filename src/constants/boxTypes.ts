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
  secret: {
    type: 'secret',
    label: 'Bí mật',
    shortLabel: 'Bí mật',
    color: Colors.boxType.secret,
    bgColor: Colors.boxType.secretBg,
    iconName: 'eye-off',
    iconFamily: 'Ionicons',
    contentPlaceholder: 'Có một điều mình chưa muốn nói ra...',
    defaultReflectionQuestion: 'Bí mật này bây giờ còn quan trọng không?',
  },
  challenge: {
    type: 'challenge',
    label: 'Thử thách',
    shortLabel: 'Thử thách',
    color: Colors.boxType.challenge,
    bgColor: Colors.boxType.challengeBg,
    iconName: 'trophy',
    iconFamily: 'Ionicons',
    contentPlaceholder: 'Thử thách mình muốn hoàn thành là...',
    defaultReflectionQuestion: 'Bạn đã hoàn thành thử thách chưa?',
  },
  letter: {
    type: 'letter',
    label: 'Lá thư',
    shortLabel: 'Lá thư',
    color: Colors.boxType.letter,
    bgColor: Colors.boxType.letterBg,
    iconName: 'mail',
    iconFamily: 'Ionicons',
    contentPlaceholder: 'Gửi tôi của tương lai...',
    defaultReflectionQuestion: 'Bạn cảm thấy thế nào khi đọc lại lá thư này?',
  },
};

export const getBoxTypeConfig = (type: string): BoxTypeConfig => {
  return BOX_TYPE_CONFIG[type] ?? BOX_TYPE_CONFIG.message;
};
