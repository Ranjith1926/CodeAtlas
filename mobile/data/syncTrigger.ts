import { AppState, AppStateStatus } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { syncPendingChanges } from './userdata';

let wired = false;
let wasOffline = false;

/**
 * Wires syncPendingChanges() to fire whenever the device regains
 * connectivity (NetInfo) or the app returns to the foreground. Safe to call
 * multiple times; only wires listeners once per app lifetime.
 */
export function wireSyncTriggers(): void {
  if (wired) return;
  wired = true;

  NetInfo.addEventListener((state) => {
    const isOnline = Boolean(state.isConnected && state.isInternetReachable !== false);
    if (isOnline && wasOffline) {
      void syncPendingChanges();
    }
    wasOffline = !isOnline;
  });

  AppState.addEventListener('change', (nextState: AppStateStatus) => {
    if (nextState === 'active') {
      void syncPendingChanges();
    }
  });
}
