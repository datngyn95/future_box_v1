import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { BoxProvider, getBoxStatus, useBoxStore } from '../src/store/boxStore';
import { initDatabase } from '../src/db/database';
import { getAllBoxes, getBoxById } from '../src/db/boxRepository';
import {
  setupNotificationHandler,
  addNotificationResponseListener,
} from '../src/services/notificationService';
import {
  isAppLockEnabled,
  isOnboardingDone,
  markOnboardingDone,
  getBackgroundedAt,
  setBackgroundedAt,
  clearBackgroundedAt,
  LOCK_TIMEOUT_MS,
} from '../src/services/settingsService';
import { hasPIN } from '../src/services/authService';
import { AppLockScreen } from '../src/components/AppLockScreen';
import { OnboardingOverlay } from '../src/components/OnboardingOverlay';

// ─── App Init ─────────────────────────────────────────────────────────────────

function AppInit() {
  const { dispatch } = useBoxStore();
  const router = useRouter();

  useEffect(() => {
    setupNotificationHandler();

    const subscription = addNotificationResponseListener(async (boxId) => {
      try {
        const box = await getBoxById(boxId);
        if (!box) {
          router.replace('/');
          return;
        }

        const status = getBoxStatus(box);
        if (status === 'opened') {
          router.push(`/box/${box.id}/detail`);
        } else if (status === 'ready_to_open') {
          router.push(`/box/${box.id}/pre-open`);
        } else {
          router.push(`/box/${box.id}/locked`);
        }
      } catch {
        router.replace('/');
      }
    });

    async function init() {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        await initDatabase();
        const boxes = await getAllBoxes();
        dispatch({ type: 'SET_BOXES', payload: boxes });
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Lỗi khởi động app';
        dispatch({ type: 'SET_ERROR', payload: msg });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    }

    init();

    return () => {
      subscription.remove();
    };
  }, [dispatch, router]);

  return null;
}

// ─── App Guard (onboarding + app lock) ────────────────────────────────────────

function AppGuard({ children }: { children: React.ReactNode }) {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showLock, setShowLock] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function checkInitialState() {
      const [onboardingDone, lockEnabled, pinSet] = await Promise.all([
        isOnboardingDone(),
        isAppLockEnabled(),
        hasPIN(),
      ]);

      if (!onboardingDone) {
        setShowOnboarding(true);
      } else if (lockEnabled && pinSet) {
        setShowLock(true);
      }

      setReady(true);
    }

    checkInitialState();
  }, []);

  // AppState: lock khi quay lại sau timeout
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextState: AppStateStatus) => {
      if (nextState === 'background' || nextState === 'inactive') {
        await setBackgroundedAt(Date.now());
      } else if (nextState === 'active') {
        const bgAt = await getBackgroundedAt();
        if (bgAt !== null) {
          const elapsed = Date.now() - bgAt;
          await clearBackgroundedAt();
          if (elapsed >= LOCK_TIMEOUT_MS) {
            const [lockEnabled, pinSet] = await Promise.all([isAppLockEnabled(), hasPIN()]);
            if (lockEnabled && pinSet) {
              setShowLock(true);
            }
          }
        }
      }
    });

    return () => subscription.remove();
  }, []);

  const handleOnboardingComplete = useCallback(async () => {
    await markOnboardingDone();
    setShowOnboarding(false);

    // Sau onboarding, kiểm tra lock (unlikely on first run, nhưng defensive)
    const [lockEnabled, pinSet] = await Promise.all([isAppLockEnabled(), hasPIN()]);
    if (lockEnabled && pinSet) {
      setShowLock(true);
    }
  }, []);

  const handleUnlocked = useCallback(() => {
    setShowLock(false);
  }, []);

  if (!ready) return null;

  return (
    <>
      {children}
      {showLock && <AppLockScreen onUnlocked={handleUnlocked} />}
      {showOnboarding && !showLock && (
        <OnboardingOverlay onComplete={handleOnboardingComplete} />
      )}
    </>
  );
}

// ─── Root Layout ──────────────────────────────────────────────────────────────

export default function RootLayout() {
  return (
    <BoxProvider>
      <AppGuard>
        <AppInit />
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="create-box/index"
            options={{ headerShown: false, animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="create-box/[type]"
            options={{ headerShown: false, animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="create-box/confirm-lock"
            options={{ headerShown: false, presentation: 'transparentModal', animation: 'fade' }}
          />
          <Stack.Screen
            name="create-box/success"
            options={{ headerShown: false, animation: 'fade', gestureEnabled: false }}
          />
          <Stack.Screen
            name="box/[id]/locked"
            options={{ headerShown: false, animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="box/[id]/pre-open"
            options={{ headerShown: false, animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="box/[id]/detail"
            options={{ headerShown: false, animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="settings"
            options={{ headerShown: false, animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="stats"
            options={{ headerShown: false, animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="auth/set-pin"
            options={{ headerShown: false, animation: 'slide_from_bottom' }}
          />
        </Stack>
      </AppGuard>
    </BoxProvider>
  );
}
