import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/Feather';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore, useLanguageStore } from '../../store';
import { Button, LanguageSwitcher } from '../../components/common';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../constants';
import { syncService } from '../../services/syncService';
import { clearAllData } from '../../database';
import { adminApi } from '../../api/admin';
import { useSyncStatus } from '../../hooks/usePatients';

const ProfileScreen = () => {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuthStore();
  const queryClient = useQueryClient();
  useLanguageStore(); // Subscribe to language changes for re-render
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isSyncingManual, setIsSyncingManual] = useState(false);
  const { queueCount, isSyncing } = useSyncStatus();

  const handleSyncNow = async () => {
    setIsSyncingManual(true);
    try {
      const result = await syncService.syncAll();
      if (result.success > 0 || result.failed > 0) {
        Alert.alert(
          'Sync Complete',
          `Synced: ${result.success}\nFailed: ${result.failed}`
        );
      } else {
        Alert.alert('Sync Complete', 'No pending items to sync');
      }
      // Refresh queries after sync
      queryClient.invalidateQueries({ queryKey: ['patients'] });
    } catch (error) {
      Alert.alert('Sync Error', 'Failed to sync. Please try again.');
    } finally {
      setIsSyncingManual(false);
    }
  };

  const handleClearLocalData = () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete ALL patient records, switches, and appointments from both your device and the server. This action cannot be undone. Continue?',
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: 'Clear All Data',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsClearing(true);
              // Stop sync service first
              syncService.stopAutoSync();

              // Clear server data first
              try {
                await adminApi.resetData();
              } catch (serverError) {
                console.log('Server reset failed (may be offline):', serverError);
              }

              // Clear all local data
              await clearAllData();
              // Invalidate all queries to force refetch
              queryClient.clear();
              // Restart sync service
              syncService.startAutoSync();
              Alert.alert('Success', 'All data has been cleared. You can now start fresh with new patients.');
            } catch (error) {
              console.error('Error clearing data:', error);
              Alert.alert('Error', 'Failed to clear data. Please try again.');
            } finally {
              setIsClearing(false);
            }
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(t('auth.logout'), t('auth.logoutConfirm'), [
      {
        text: t('common.cancel'),
        style: 'cancel',
      },
      {
        text: t('auth.logout'),
        style: 'destructive',
        onPress: () => {
          syncService.stopAutoSync();
          logout();
        },
      },
    ]);
  };

  const getLanguageDisplay = () => {
    return i18n.language === 'es' ? 'Español' : 'English';
  };

  const MenuItem = ({
    icon,
    label,
    value,
    onPress,
    valueColor,
  }: {
    icon: string;
    label: string;
    value?: string;
    onPress?: () => void;
    valueColor?: string;
  }) => (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.menuItemLeft}>
        <View style={styles.menuIconContainer}>
          <Icon name={icon} size={18} color={COLORS.primary} />
        </View>
        <Text style={styles.menuItemText}>{label}</Text>
      </View>
      <View style={styles.menuItemRight}>
        {value && (
          <Text style={[styles.menuItemValue, valueColor && { color: valueColor }]}>
            {value}
          </Text>
        )}
        {onPress && <Icon name="chevron-right" size={18} color={COLORS.textTertiary} />}
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* User Header */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </Text>
        </View>
        <Text style={styles.name}>{user?.name || 'User'}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <View style={styles.roleBadge}>
          <Icon name="shield" size={12} color={COLORS.primary} />
          <Text style={styles.roleText}>{user?.role || 'STAFF'}</Text>
        </View>
      </View>

      {/* Account Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.sectionCard}>
          <MenuItem
            icon="user"
            label={t('profile.editProfile')}
            onPress={() => {}}
          />
          <View style={styles.menuDivider} />
          <MenuItem
            icon="bell"
            label={t('profile.notifications')}
            onPress={() => {}}
          />
          <View style={styles.menuDivider} />
          <MenuItem
            icon="globe"
            label={t('profile.language')}
            value={getLanguageDisplay()}
            onPress={() => setShowLanguageModal(true)}
          />
        </View>
      </View>

      {/* Data & Sync Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data & Sync</Text>
        <View style={styles.sectionCard}>
          <MenuItem
            icon="refresh-cw"
            label={t('profile.syncStatus')}
            value={isSyncing ? 'Syncing...' : (queueCount > 0 ? `${queueCount} pending` : 'Synced')}
            valueColor={queueCount > 0 ? COLORS.warning : COLORS.success}
          />
          <View style={styles.menuDivider} />
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleSyncNow}
            disabled={isSyncingManual || isSyncing}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIconContainer, { backgroundColor: COLORS.primary + '10' }]}>
                <Icon name="upload-cloud" size={18} color={COLORS.primary} />
              </View>
              <Text style={styles.menuItemText}>Sync Now</Text>
            </View>
            <View style={styles.menuItemRight}>
              {isSyncingManual ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <Icon name="chevron-right" size={18} color={COLORS.textTertiary} />
              )}
            </View>
          </TouchableOpacity>
          <View style={styles.menuDivider} />
          <MenuItem
            icon="database"
            label={t('profile.storageUsed')}
            value="~2 MB"
          />
          <View style={styles.menuDivider} />
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleClearLocalData}
            disabled={isClearing}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIconContainer, { backgroundColor: COLORS.error + '10' }]}>
                <Icon name="trash-2" size={18} color={COLORS.error} />
              </View>
              <Text style={[styles.menuItemText, { color: COLORS.error }]}>Clear All Data</Text>
            </View>
            <View style={styles.menuItemRight}>
              {isClearing ? (
                <ActivityIndicator size="small" color={COLORS.error} />
              ) : (
                <Icon name="chevron-right" size={18} color={COLORS.textTertiary} />
              )}
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* About Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.sectionCard}>
          <MenuItem
            icon="info"
            label={t('profile.appVersion')}
            value="1.0.0"
          />
          <View style={styles.menuDivider} />
          <MenuItem
            icon="file-text"
            label={t('profile.privacyPolicy')}
            onPress={() => {}}
          />
          <View style={styles.menuDivider} />
          <MenuItem
            icon="book"
            label={t('profile.termsOfService')}
            onPress={() => {}}
          />
        </View>
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Icon name="log-out" size={18} color={COLORS.error} />
        <Text style={styles.logoutButtonText}>{t('auth.logout')}</Text>
      </TouchableOpacity>

      <Text style={styles.footer}>{t('profile.appFooter')}</Text>

      {/* Language Modal */}
      <Modal
        visible={showLanguageModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowLanguageModal(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('languages.selectLanguage')}</Text>
              <TouchableOpacity onPress={() => setShowLanguageModal(false)}>
                <Icon name="x" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            <LanguageSwitcher variant="full" />
            <Button
              title={t('common.ok')}
              onPress={() => setShowLanguageModal(false)}
              style={styles.modalButton}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  header: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    marginBottom: SPACING.md,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.surface,
  },
  name: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  email: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    gap: SPACING.xs,
  },
  roleText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: '600',
    color: COLORS.primary,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    marginLeft: SPACING.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  menuItemText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.text,
    fontWeight: '500',
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  menuItemValue: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  menuDivider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginLeft: 60,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.errorLight,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },
  logoutButtonText: {
    color: COLORS.error,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: '600',
  },
  footer: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textTertiary,
    textAlign: 'center',
    marginTop: SPACING.xl,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    width: '85%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  modalButton: {
    marginTop: SPACING.lg,
  },
});

export default ProfileScreen;
