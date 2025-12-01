/**
 * Synka - Biosimilar Switch Kit MVP
 * Mobile Application
 */

import React, { useEffect } from 'react';
import { StatusBar, LogBox } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
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
      } catch (error) {
        console.error('Failed to initialize app:', error);
      }
    };

    initializeApp();

    // Cleanup: Stop auto-sync when app unmounts
    return () => {
      syncService.stopAutoSync();
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
