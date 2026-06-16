// FutureBoxes — Box State Management
// React Context + useReducer. Không dùng Zustand/Redux ở MVP.
// Mọi component cần đọc/ghi danh sách hộp đều dùng hook useBoxStore().

import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useMemo,
} from 'react';
import { Box, BoxStatus } from '../types/box';

// ─── State & Actions ──────────────────────────────────────────────────────────

interface BoxState {
  boxes: Box[];
  isLoading: boolean;
  error: string | null;
}

export type BoxAction =
  | { type: 'SET_BOXES'; payload: Box[] }
  | { type: 'ADD_BOX'; payload: Box }
  | { type: 'DELETE_BOX'; payload: string }          // payload = boxId
  | { type: 'UPDATE_BOX'; payload: Box }              // thay thế 1 hộp trong list
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

const initialState: BoxState = {
  boxes: [],
  isLoading: false,
  error: null,
};

function boxReducer(state: BoxState, action: BoxAction): BoxState {
  switch (action.type) {
    case 'SET_BOXES':
      return { ...state, boxes: action.payload };

    case 'ADD_BOX':
      return { ...state, boxes: [action.payload, ...state.boxes] };

    case 'DELETE_BOX':
      return {
        ...state,
        boxes: state.boxes.filter((b) => b.id !== action.payload),
      };

    case 'UPDATE_BOX':
      return {
        ...state,
        boxes: state.boxes.map((b) =>
          b.id === action.payload.id ? action.payload : b,
        ),
      };

    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload };

    default:
      return state;
  }
}

// ─── Derived / Computed ───────────────────────────────────────────────────────

/**
 * Tính trạng thái thực tế của hộp dựa trên đồng hồ thiết bị (AC-03.3).
 * KHÔNG lưu cứng vào DB — computed mỗi lần cần.
 */
export function getBoxStatus(box: Box): BoxStatus {
  if (box.openedAt) return 'opened';
  const now = new Date();
  const unlockDate = new Date(box.unlockDate);
  return now >= unlockDate ? 'ready_to_open' : 'locked';
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface BoxContextValue {
  state: BoxState;
  dispatch: React.Dispatch<BoxAction>;
  // Computed selectors
  getBoxesByStatus: (status: BoxStatus) => Box[];
  getComputedStatus: (box: Box) => BoxStatus;
}

const BoxContext = createContext<BoxContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function BoxProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(boxReducer, initialState);

  const getBoxesByStatus = useCallback(
    (status: BoxStatus): Box[] => {
      return state.boxes.filter((box) => getBoxStatus(box) === status);
    },
    [state.boxes],
  );

  const getComputedStatus = useCallback(
    (box: Box): BoxStatus => getBoxStatus(box),
    [],
  );

  const value = useMemo(
    () => ({ state, dispatch, getBoxesByStatus, getComputedStatus }),
    [state, dispatch, getBoxesByStatus, getComputedStatus],
  );

  return <BoxContext.Provider value={value}>{children}</BoxContext.Provider>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useBoxStore(): BoxContextValue {
  const ctx = useContext(BoxContext);
  if (!ctx) {
    throw new Error('useBoxStore phải dùng bên trong BoxProvider');
  }
  return ctx;
}
