// BoxIcon — Icon tròn đặc trưng cho từng loại hộp

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getBoxTypeConfig } from '../constants/boxTypes';
import { BoxType } from '../types/box';
import { Radius } from '../constants/spacing';

interface BoxIconProps {
  boxType: BoxType;
  size?: number;
  showLockOverlay?: boolean;
}

export function BoxIcon({ boxType, size = 40, showLockOverlay = false }: BoxIconProps) {
  const config = getBoxTypeConfig(boxType);
  const iconSize = Math.round(size * 0.55);
  const lockSize = Math.round(size * 0.35);

  return (
    <View style={[styles.container, {
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: config.bgColor,
    }]}>
      <Ionicons name={config.iconName as keyof typeof Ionicons.glyphMap} size={iconSize} color={config.color} />
      {showLockOverlay && (
        <View style={[styles.lockOverlay, {
          width: lockSize,
          height: lockSize,
          borderRadius: lockSize / 2,
        }]}>
          <Ionicons name="lock-closed" size={lockSize * 0.6} color="#FFFFFF" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockOverlay: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#6B7280',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
