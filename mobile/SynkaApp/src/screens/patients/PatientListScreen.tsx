import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { usePatients, useSyncStatus } from '../../hooks/usePatients';
import { syncService } from '../../services/syncService';
import { Patient } from '../../types';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, DIAGNOSES, ALLERGIES } from '../../constants';
import { formatDate, calculateAge } from '../../utils/date';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<any, 'PatientList'>;

const PatientListScreen: React.FC<Props> = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const { patients, isLoading, isOnline, refetch } = usePatients(debouncedSearch);
  const { queueCount, isSyncing } = useSyncStatus();

  // Start auto sync on mount
  useEffect(() => {
    syncService.startAutoSync();
    return () => syncService.stopAutoSync();
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handlePatientPress = (patient: Patient) => {
    navigation.navigate('PatientDetail', { patientId: patient.id });
  };

  const handleAddPatient = () => {
    navigation.navigate('PatientForm');
  };

  const getDiagnosisLabel = (code: string | undefined) => {
    if (!code) return null;
    const diagnosis = DIAGNOSES.find(d => d.code === code);
    return diagnosis?.label || code;
  };

  const getAllergyLabels = (allergies: string | undefined) => {
    if (!allergies) return [];
    const codes = allergies.split(',').map(s => s.trim()).filter(Boolean);
    return codes.map(code => {
      const allergy = ALLERGIES.find(a => a.code === code);
      return allergy?.label || code;
    });
  };

  const renderPatientItem = ({ item }: { item: Patient }) => {
    const age = calculateAge(item.dateOfBirth);
    const allergyLabels = getAllergyLabels(item.allergies);
    const hasNKDA = item.allergies?.includes('NKDA');

    return (
      <TouchableOpacity
        style={styles.patientCard}
        onPress={() => handlePatientPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.patientHeader}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {item.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.patientMainInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.patientName}>{item.name}</Text>
              <View style={styles.badges}>
                <View style={[
                  styles.languageBadge,
                  item.language === 'ES' ? styles.spanishBadge : styles.englishBadge
                ]}>
                  <Icon name="globe" size={10} color={item.language === 'ES' ? COLORS.warning : COLORS.secondary} />
                  <Text style={[
                    styles.languageText,
                    { color: item.language === 'ES' ? COLORS.warning : COLORS.secondary }
                  ]}>
                    {item.language === 'ES' ? 'ES' : 'EN'}
                  </Text>
                </View>
                {!item.synced && (
                  <View style={styles.unsyncedBadge}>
                    <Icon name="cloud-off" size={10} color={COLORS.warning} />
                  </View>
                )}
              </View>
            </View>
            <View style={styles.patientDetails}>
              <View style={styles.detailItem}>
                <Icon name="phone" size={12} color={COLORS.textTertiary} />
                <Text style={styles.detailText}>{item.phone}</Text>
              </View>
              <View style={styles.detailItem}>
                <Icon name="calendar" size={12} color={COLORS.textTertiary} />
                <Text style={styles.detailText}>{age} years</Text>
              </View>
            </View>
          </View>
          <Icon name="chevron-right" size={20} color={COLORS.textTertiary} />
        </View>

        {item.diagnosis && (
          <View style={styles.diagnosisContainer}>
            <Icon name="activity" size={12} color={COLORS.primary} />
            <Text style={styles.diagnosisText}>{getDiagnosisLabel(item.diagnosis)}</Text>
          </View>
        )}

        {allergyLabels.length > 0 && !hasNKDA && (
          <View style={styles.allergyContainer}>
            <Icon name="alert-triangle" size={12} color={COLORS.error} />
            <Text style={styles.allergyText} numberOfLines={1}>
              {allergyLabels.slice(0, 2).join(', ')}
              {allergyLabels.length > 2 && ` +${allergyLabels.length - 2} more`}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.statusBar}>
        <View style={styles.connectionStatus}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: isOnline ? COLORS.success : COLORS.warning },
            ]}
          />
          <Text style={styles.statusText}>
            {isOnline ? 'Online' : 'Offline'}
          </Text>
        </View>

        {queueCount > 0 && (
          <View style={styles.syncStatus}>
            {isSyncing && <ActivityIndicator size="small" color={COLORS.primary} />}
            <Icon name="upload-cloud" size={14} color={COLORS.primary} />
            <Text style={styles.queueText}>
              {queueCount} pending
            </Text>
          </View>
        )}
      </View>

      <View style={styles.searchContainer}>
        <Icon name="search" size={18} color={COLORS.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or phone..."
          placeholderTextColor={COLORS.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => setSearchQuery('')}
          >
            <Icon name="x" size={18} color={COLORS.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Icon name="users" size={48} color={COLORS.textTertiary} />
      </View>
      <Text style={styles.emptyTitle}>No Patients Found</Text>
      <Text style={styles.emptyText}>
        {searchQuery
          ? `No patients match "${searchQuery}"`
          : 'Get started by adding your first patient'}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={patients}
        renderItem={renderPatientItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={isLoading ? null : renderEmptyState}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} />
        }
      />

      <TouchableOpacity style={styles.fab} onPress={handleAddPatient}>
        <Icon name="plus" size={24} color={COLORS.surface} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  listContent: {
    padding: SPACING.md,
    flexGrow: 1,
  },
  header: {
    marginBottom: SPACING.md,
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: SPACING.xs,
  },
  statusText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  syncStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  queueText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.primary,
    fontWeight: '500',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  searchIcon: {
    marginLeft: SPACING.md,
  },
  searchInput: {
    flex: 1,
    height: 50,
    paddingHorizontal: SPACING.sm,
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.text,
  },
  clearButton: {
    padding: SPACING.md,
  },
  patientCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  patientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  avatarText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: '700',
    color: COLORS.surface,
  },
  patientMainInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  patientName: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  badges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  languageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
    gap: 4,
  },
  spanishBadge: {
    backgroundColor: COLORS.warningLight,
  },
  englishBadge: {
    backgroundColor: COLORS.secondary + '15',
  },
  languageText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: '600',
  },
  unsyncedBadge: {
    padding: 4,
    backgroundColor: COLORS.warningLight,
    borderRadius: BORDER_RADIUS.sm,
  },
  patientDetails: {
    flexDirection: 'row',
    marginTop: SPACING.xs,
    gap: SPACING.md,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  diagnosisContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    gap: SPACING.xs,
  },
  diagnosisText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.primary,
    fontWeight: '500',
  },
  allergyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
    gap: SPACING.xs,
  },
  allergyText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.error,
    fontWeight: '500',
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
  },
  fab: {
    position: 'absolute',
    right: SPACING.lg,
    bottom: SPACING.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});

export default PatientListScreen;
