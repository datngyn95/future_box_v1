# Common Errors & Fixes

## Expo Go / SDK Compatibility

### SDK version too new for Expo Go
**Error:** `Project is incompatible with this version of Expo Go. The project requires a newer version.`
**Cause:** Expo Go trên device chỉ support SDK 54, project dùng SDK 56.
**Fix:** Downgrade project về SDK 54 (xem bên dưới) hoặc update Expo Go lên bản mới nhất.

### PlatformConstants TurboModule not found
**Error:** `TurboModuleRegistry.getEnforcing(...): 'PlatformConstants' could not be found.`
**Cause:** React Native version trong JS bundle không khớp với Expo Go binary (SDK mismatch).
**Fix:** Đảm bảo `react-native` version trong package.json đúng với SDK target. SDK 54 = RN 0.81.5.

---

## react-native-worklets

### Worklets peer dep không tương thích
**Error:** `Exception in HostFunction: <unknown>` tại `installTurboModule` → `NativeWorklets`
**Cause:** `react-native-worklets@0.9.2` yêu cầu `react-native: 0.83 - 0.86`, nhưng SDK 54 dùng RN 0.81.5.
**Fix:** Dùng `react-native-worklets@0.5.2` (peer dep `react-native: '*'`, tương thích mọi version).

### Cannot find module 'react-native-worklets/plugin'
**Error:** `[BABEL]: Cannot find module 'react-native-worklets/plugin'`
**Cause:** `react-native-worklets` bị thiếu khỏi dependencies khi downgrade.
**Fix:** Thêm lại `react-native-worklets` vào package.json và npm install.

### Cannot find module '@babel/core'
**Error:** `[BABEL]: Cannot find module '@babel/core'` trong worklets plugin
**Cause:** SDK 54 không hoist `@babel/core` lên root level (nằm nested trong `@expo/metro-config`).
**Fix:** Thêm `"@babel/core": "^7.25.0"` vào devDependencies.

### Babel version conflict
**Error:** `Requires Babel "^7.0.0-0", but was loaded with "8.0.0"`
**Cause:** `npm install @babel/core` không chỉ version → cài Babel 8, nhưng worklets cần Babel 7.
**Fix:** Chỉ định rõ version: `npm install --save-dev @babel/core@^7.25.0`

---

## Expo Config Plugins

### expo-status-bar plugin không tồn tại trong SDK 54
**Error:** `PluginError: Failed to resolve plugin for module "expo-status-bar"`
**Cause:** `expo-status-bar` trong SDK 54 không có config plugin (chỉ là component library).
**Fix:** Xóa `"expo-status-bar"` khỏi mảng `plugins` trong `app.json`.

---

## Windows: node_modules Deletion

### EPERM khi xóa node_modules
**Error:** `npm error EPERM: operation not permitted, scandir 'node_modules/...'`
**Cause:** Metro bundler hoặc antivirus đang giữ file lock trên node_modules.
**Fix:**
1. Kill tất cả node processes: `Get-Process -Name "node" | Stop-Process -Force`
2. Sau đó chạy lại `npm install --legacy-peer-deps`

### Xóa node_modules bằng robocopy (nếu rm -rf thất bại)
```powershell
New-Item -ItemType Directory -Force -Path "empty_tmp"
robocopy empty_tmp node_modules /MIR /NFL /NDL /NJH /NJS
Remove-Item -Force "empty_tmp"
Remove-Item -Recurse -Force "node_modules"
```

---

## SDK 54 Downgrade Checklist

Khi downgrade từ SDK 56 → SDK 54, phải thay đổi:

| File | Thay đổi |
|------|---------|
| `package.json` | Đổi tất cả package versions, dùng `worklets@0.5.2`, thêm `@babel/core@^7.25.0` |
| `app.json` | Xóa `"expo-status-bar"` khỏi `plugins[]` |
| `tsconfig.json` | Xóa `"ignoreDeprecations": "6.0"` (chỉ dùng cho TS 6) |
| Install | `npm install --legacy-peer-deps` |
| Start | `npx expo start --clear` |
