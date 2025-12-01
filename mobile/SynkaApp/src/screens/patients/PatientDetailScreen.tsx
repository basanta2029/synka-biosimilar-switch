import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { usePatient, useDeletePatient } from '../../hooks/usePatients';
import { switchesApi } from '../../api/switches';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, DIAGNOSES, ALLERGIES } from '../../constants';
import { calculateAge } from '../../utils/date';
import { SwitchRecord } from '../../types';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<any, 'PatientDetail'>;

const PatientDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { patientId } = route.params;
  const { patient, isLoading } = usePatient(patientId);
  const deletePatient = useDeletePatient();

  const [switches, setSwitches] = useState<SwitchRecord[]>([]);
  const [loadingSwitches, setLoadingSwitches] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadSwitches = async () => {
    try {
      const response = await switchesApi.getPatientSwitches(patientId);
      setSwitches(response.switches || []);
    } catch (error) {
      console.log('Error loading switches:', error);
    } finally {
      setLoadingSwitches(false);
    }
  };

  useEffect(() => {
    loadSwitches();
  }, [patientId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSwitches();
    setRefreshing(false);
  };

  const handleEdit = () => {
    navigation.navigate('PatientForm', { patientId });
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Patient',
      'Are you sure you want to delete this patient? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePatient.mutateAsync(patientId);
              Alert.alert('Success', 'Patient deleted successfully', [
                {
                  text: 'OK',
                  onPress: () => navigation.goBack(),
                },
              ]);
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete patient');
            }
          },
        },
      ]
    );
  };

  const handleStartSwitch = () => {
    navigation.navigate('SwitchWorkflow', { patientId });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return COLORS.success;
      case 'PENDING': return COLORS.warning;
      case 'FAILED': return COLORS.error;
      case 'CANCELLED': return COLORS.textSecondary;
      default: return COLORS.textSecondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'check-circle';
      case 'PENDING': return 'clock';
      case 'FAILED': return 'x-circle';
      case 'CANCELLED': return 'slash';
      default: return 'circle';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
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

  if (isLoading || !patient) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading patient...</Text>
      </View>
    );
  }

  const age = calculateAge(patient.dateOfBirth);
  const allergyLabels = getAllergyLabels(patient.allergies);
  const hasNKDA = patient.allergies?.includes('NKDA');

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Quick Action Banner */}
      <TouchableOpacity style={styles.quickActionBanner} onPress={handleStartSwitch}>
        <View style={styles.bannerContent}>
          <View style={styles.bannerIconContainer}>
            <Icon name="refresh-cw" size={24} color={COLORS.surface} />
          </View>
          <View style={styles.bannerText}>
            <Text style={styles.bannerTitle}>Start Biosimilar Switch</Text>
            <Text style={styles.bannerSubtitle}>Save up to 77% on medication costs</Text>
          </View>
        </View>
        <Icon name="chevron-right" size={24} color={COLORS.surface} />
      </TouchableOpacity>

      {/* Patient Info Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleRow}>
            <Icon name="user" size={18} color={COLORS.text} />
            <Text style={styles.cardTitle}>Patient Information</Text>
          </View>
          {!patient.synced && (
            <View style={styles.unsyncedBadge}>
              <Icon name="cloud-off" size={10} color={COLORS.warning} />
              <Text style={styles.unsyncedText}>Unsynced</Text>
            </View>
          )}
        </View>

        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Text style={styles.label}>Full Name</Text>
            <Text style={styles.value}>{patient.name}</Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.label}>Age</Text>
            <Text style={styles.value}>{age} years</Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.label}>Phone</Text>
            <Text style={styles.value}>{patient.phone}</Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.label}>Language</Text>
            <View style={styles.languageValue}>
              <Icon name="globe" size={14} color={COLORS.textSecondary} />
              <Text style={styles.value}>
                {patient.language === 'ES' ? 'Spanish' : 'English'}
              </Text>
            </View>
          </View>
        </View>

        {patient.diagnosis && (
          <View style={styles.diagnosisBox}>
            <View style={styles.diagnosisHeader}>
              <Icon name="activity" size={14} color={COLORS.primary} />
              <Text style={styles.diagnosisTitle}>Primary Diagnosis</Text>
            </View>
            <Text style={styles.diagnosisText}>{getDiagnosisLabel(patient.diagnosis)}</Text>
          </View>
        )}

        {allergyLabels.length > 0 && (
          <View style={[
            styles.allergyBox,
            hasNKDA ? styles.allergyBoxNone : styles.allergyBoxWarning
          ]}>
            <View style={styles.allergyHeader}>
              <Icon
                name={hasNKDA ? 'check-circle' : 'alert-triangle'}
                size={14}
                color={hasNKDA ? COLORS.success : COLORS.error}
              />
              <Text style={[
                styles.allergyTitle,
                { color: hasNKDA ? COLORS.success : COLORS.error }
              ]}>
                {hasNKDA ? 'No Known Drug Allergies' : 'Allergies'}
              </Text>
            </View>
            {!hasNKDA && (
              <Text style={styles.allergyText}>{allergyLabels.join(', ')}</Text>
            )}
          </View>
        )}

        <TouchableOpacity style={styles.editLink} onPress={handleEdit}>
          <Icon name="edit-2" size={16} color={COLORS.primary} />
          <Text style={styles.editLinkText}>Edit Details</Text>
        </TouchableOpacity>
      </View>

      {/* Switch History Card */}
      <View style={styles.card}>
        <View style={styles.cardTitleRow}>
          <Icon name="repeat" size={18} color={COLORS.text} />
          <Text style={styles.cardTitle}>Switch History</Text>
        </View>

        {loadingSwitches ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginVertical: SPACING.lg }} />
        ) : switches.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Icon name="clipboard" size={32} color={COLORS.textTertiary} />
            </View>
            <Text style={styles.emptyText}>No biosimilar switches yet</Text>
            <Text style={styles.emptySubtext}>
              Start a switch to help this patient save on their medication costs
            </Text>
          </View>
        ) : (
          switches.map((switchRecord) => (
            <View key={switchRecord.id} style={styles.switchCard}>
              <View style={styles.switchHeader}>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(switchRecord.status) + '15' }]}>
                  <Icon name={getStatusIcon(switchRecord.status)} size={12} color={getStatusColor(switchRecord.status)} />
                  <Text style={[styles.statusText, { color: getStatusColor(switchRecord.status) }]}>
                    {switchRecord.status}
                  </Text>
                </View>
                <View style={styles.switchDateContainer}>
                  <Icon name="calendar" size={12} color={COLORS.textSecondary} />
                  <Text style={styles.switchDate}>
                    {new Date(switchRecord.switchDate).toLocaleDateString()}
                  </Text>
                </View>
              </View>

              <View style={styles.switchDrugs}>
                <Text style={styles.drugFrom}>{switchRecord.fromDrug?.name}</Text>
                <Icon name="arrow-right" size={16} color={COLORS.primary} />
                <Text style={styles.drugTo}>{switchRecord.toDrug?.name}</Text>
              </View>

              {switchRecord.fromDrug && switchRecord.toDrug && (
                <View style={styles.savingsContainer}>
                  <Icon name="trending-up" size={14} color={COLORS.success} />
                  <Text style={styles.savingsText}>
                    Saving {formatCurrency(switchRecord.fromDrug.costPerMonth - switchRecord.toDrug.costPerMonth)}/month
                  </Text>
                </View>
              )}
            </View>
          ))
        )}
      </View>

      {/* Delete Button */}
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={handleDelete}
        disabled={deletePatient.isPending}
      >
        {deletePatient.isPending ? (
          <ActivityIndicator color={COLORS.error} />
        ) : (
          <>
            <Icon name="trash-2" size={18} color={COLORS.error} />
            <Text style={styles.deleteButtonText}>Delete Patient</Text>
          </>
        )}
      </TouchableOpacity>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
  },
  quickActionBanner: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  bannerIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  bannerText: {
    flex: 1,
  },
  bannerTitle: {
    color: COLORS.surface,
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: '700',
  },
  bannerSubtitle: {
    color: COLORS.surface,
    fontSize: TYPOGRAPHY.fontSize.sm,
    opacity: 0.9,
    marginTop: 2,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  cardTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  unsyncedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.warningLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    gap: 4,
  },
  unsyncedText: {
    color: COLORS.warning,
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: '600',
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  infoItem: {
    width: '50%',
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.text,
    fontWeight: '500',
  },
  languageValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  diagnosisBox: {
    backgroundColor: COLORS.primary + '10',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.sm,
  },
  diagnosisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  diagnosisTitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '600',
    color: COLORS.primary,
  },
  diagnosisText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.text,
    fontWeight: '500',
  },
  allergyBox: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.sm,
  },
  allergyBoxWarning: {
    backgroundColor: COLORS.errorLight,
  },
  allergyBoxNone: {
    backgroundColor: COLORS.successLight,
  },
  allergyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  allergyTitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '600',
  },
  allergyText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.error,
    marginTop: SPACING.xs,
  },
  editLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    gap: SPACING.xs,
  },
  editLinkText: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  emptyIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textTertiary,
    textAlign: 'center',
    marginTop: SPACING.xs,
    paddingHorizontal: SPACING.lg,
  },
  switchCard: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.sm,
  },
  switchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
    gap: SPACING.xs,
  },
  statusText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: '600',
  },
  switchDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  switchDate: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  switchDrugs: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
    gap: SPACING.sm,
  },
  drugFrom: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  drugTo: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: '600',
    color: COLORS.success,
  },
  savingsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  savingsText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.success,
    fontWeight: '500',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.errorLight,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },
  deleteButtonText: {
    color: COLORS.error,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: '600',
  },
});

export default PatientDetailScreen;
