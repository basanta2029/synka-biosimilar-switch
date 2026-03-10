/**
 * Synka - Biosimilar Switch Kit MVP
 * Mobile Application
 */

import React, { useEffect, useRef } from 'react';
import { StatusBar, LogBox } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import NetInfo from '@react-native-community/netinfo';
import { RootNavigator } from './src/navigation';
import { initDatabase } from './src/database';
import { syncService } from './src/services/syncService';
import './src/config/i18n';
import { useLanguageStore } from './src/store';

// Ignore specific warnings
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
]);

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // Don't retry network errors (offline)
        if (error?.message?.includes('Network Error') || error?.code === 'ECONNABORTED') {
          return false;
        }
        // Retry other errors max 2 times
        return failureCount < 2;
      },
      staleTime: 1000 * 60 * 5, // 5 minutes
      networkMode: 'offlineFirst', // Prioritize cached data when offline
    },
  },
});

function App() {
  const { loadLanguage } = useLanguageStore();
  const wasOffline = useRef(false);

  useEffect(() => {
    // Initialize app
    const initializeApp = async () => {
      try {
        // Load saved language preference
        await loadLanguage();
        console.log('Language loaded successfully');

        // Initialize database
        await initDatabase();
        console.log('Database initialized successfully');

        // Start automatic background sync
        syncService.startAutoSync();
        console.log('Auto-sync service started');

        // Run initial sync check after app starts (in case there are pending items from previous session)
        const netState = await NetInfo.fetch();
        if (netState.isConnected) {
          console.log('Running initial sync check on app start...');
          await syncService.requeueUnsyncedPatients();
          await syncService.syncAll();
        } else {
          // Mark that we're starting offline
          wasOffline.current = true;
        }
      } catch (error) {
        console.error('Failed to initialize app:', error);
      }
    };

    initializeApp();

    // Listen for network state changes to sync immediately when coming online
    const unsubscribeNetInfo = NetInfo.addEventListener((state) => {
      const isConnected = state.isConnected ?? false;

      if (isConnected && wasOffline.current) {
        console.log('Network restored - triggering immediate sync');
        // Re-queue any orphaned unsynced items and sync
        syncService.requeueUnsyncedPatients().then(() => {
          syncService.syncAll();
        });
      }

      wasOffline.current = !isConnected;
    });

    // Cleanup: Stop auto-sync and remove network listener when app unmounts
    return () => {
      syncService.stopAutoSync();
      unsubscribeNetInfo();
    };
  }, [loadLanguage]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
          <RootNavigator />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default App;
