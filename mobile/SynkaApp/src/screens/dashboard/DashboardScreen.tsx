import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { switchesApi } from '../../api/switches';
import { patientsApi } from '../../api/patients';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../constants';

interface DashboardStats {
  totalSwitches: number;
  pendingSwitches: number;
  completedSwitches: number;
  failedSwitches: number;
  successRate: number;
  upcomingAppointments: number;
  unreviewedAlerts: number;
  totalMonthlySavings: number;
  totalAnnualSavings: number;
}

const DashboardScreen: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [patientCount, setPatientCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [dashboardStats, patientsResponse] = await Promise.all([
        switchesApi.getDashboardStats(),
        patientsApi.getPatients({}),
      ]);
      setStats(dashboardStats);
      setPatientCount(patientsResponse.total || patientsResponse.patients?.length || 0);
    } catch (error) {
      console.log('Error loading dashboard:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Welcome Section */}
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeText}>Dashboard</Text>
        <Text style={styles.welcomeSubtext}>Biosimilar Switch Management</Text>
      </View>

      {/* Cost Savings Card */}
      <View style={styles.savingsCard}>
        <View style={styles.savingsHeader}>
          <View style={styles.savingsIconContainer}>
            <Icon name="trending-up" size={24} color={COLORS.surface} />
          </View>
          <View style={styles.savingsHeaderText}>
            <Text style={styles.savingsTitle}>Total Cost Savings</Text>
            <Text style={styles.savingsSubtitle}>From biosimilar switches</Text>
          </View>
        </View>
        <Text style={styles.savingsAmount}>
          {formatCurrency(stats?.totalAnnualSavings || 0)}
        </Text>
        <Text style={styles.savingsLabel}>Projected Annual Savings</Text>
        <View style={styles.savingsDivider} />
        <View style={styles.monthlySavings}>
          <View style={styles.monthlyItem}>
            <Text style={styles.monthlyLabel}>Monthly</Text>
            <Text style={styles.monthlyAmount}>
              {formatCurrency(stats?.totalMonthlySavings || 0)}
            </Text>
          </View>
          <View style={styles.monthlyDivider} />
          <View style={styles.monthlyItem}>
            <Text style={styles.monthlyLabel}>Success Rate</Text>
            <Text style={styles.monthlyAmount}>{stats?.successRate || 0}%</Text>
          </View>
        </View>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, styles.statCardLeft]}>
          <View style={[styles.statIconContainer, { backgroundColor: COLORS.secondary + '15' }]}>
            <Icon name="users" size={20} color={COLORS.secondary} />
          </View>
          <Text style={styles.statValue}>{patientCount}</Text>
          <Text style={styles.statLabel}>Total Patients</Text>
        </View>

        <View style={[styles.statCard, styles.statCardRight]}>
          <View style={[styles.statIconContainer, { backgroundColor: COLORS.primary + '15' }]}>
            <Icon name="repeat" size={20} color={COLORS.primary} />
          </View>
          <Text style={styles.statValue}>{stats?.totalSwitches || 0}</Text>
          <Text style={styles.statLabel}>Total Switches</Text>
        </View>

        <View style={[styles.statCard, styles.statCardLeft]}>
          <View style={[styles.statIconContainer, { backgroundColor: COLORS.success + '15' }]}>
            <Icon name="check-circle" size={20} color={COLORS.success} />
          </View>
          <Text style={[styles.statValue, { color: COLORS.success }]}>
            {stats?.completedSwitches || 0}
          </Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>

        <View style={[styles.statCard, styles.statCardRight]}>
          <View style={[styles.statIconContainer, { backgroundColor: COLORS.warning + '15' }]}>
            <Icon name="calendar" size={20} color={COLORS.warning} />
          </View>
          <Text style={styles.statValue}>{stats?.upcomingAppointments || 0}</Text>
          <Text style={styles.statLabel}>Upcoming</Text>
        </View>
      </View>

      {/* Switch Status Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Icon name="activity" size={20} color={COLORS.text} />
          <Text style={styles.cardTitle}>Switch Status Overview</Text>
        </View>
        <View style={styles.statusList}>
          <View style={styles.statusItem}>
            <View style={styles.statusLeft}>
              <View style={[styles.statusDot, { backgroundColor: COLORS.warning }]} />
              <Text style={styles.statusLabel}>Pending Review</Text>
            </View>
            <Text style={styles.statusValue}>{stats?.pendingSwitches || 0}</Text>
          </View>
          <View style={styles.statusItem}>
            <View style={styles.statusLeft}>
              <View style={[styles.statusDot, { backgroundColor: COLORS.success }]} />
              <Text style={styles.statusLabel}>Successfully Completed</Text>
            </View>
            <Text style={styles.statusValue}>{stats?.completedSwitches || 0}</Text>
          </View>
          <View style={styles.statusItem}>
            <View style={styles.statusLeft}>
              <View style={[styles.statusDot, { backgroundColor: COLORS.error }]} />
              <Text style={styles.statusLabel}>Failed / Discontinued</Text>
            </View>
            <Text style={styles.statusValue}>{stats?.failedSwitches || 0}</Text>
          </View>
        </View>

        {/* Progress Bar */}
        {(stats?.totalSwitches || 0) > 0 && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressSegment,
                  {
                    flex: stats?.completedSwitches || 0,
                    backgroundColor: COLORS.success
                  }
                ]}
              />
              <View
                style={[
                  styles.progressSegment,
                  {
                    flex: stats?.pendingSwitches || 0,
                    backgroundColor: COLORS.warning
                  }
                ]}
              />
              <View
                style={[
                  styles.progressSegment,
                  {
                    flex: stats?.failedSwitches || 0,
                    backgroundColor: COLORS.error
                  }
                ]}
              />
            </View>
          </View>
        )}
      </View>

      {/* Info Card */}
      <View style={styles.infoCard}>
        <View style={styles.infoIconContainer}>
          <Icon name="info" size={20} color={COLORS.secondary} />
        </View>
        <View style={styles.infoContent}>
          <Text style={styles.infoTitle}>About Biosimilar Switches</Text>
          <Text style={styles.infoText}>
            Biosimilar medications can save patients up to 77% on medication costs while providing equivalent therapeutic benefits as brand-name biologics.
          </Text>
        </View>
      </View>
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
  welcomeSection: {
    marginBottom: SPACING.lg,
  },
  welcomeText: {
    fontSize: TYPOGRAPHY.fontSize.xxl,
    fontWeight: '700',
    color: COLORS.text,
  },
  welcomeSubtext: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  savingsCard: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  savingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  savingsIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  savingsHeaderText: {
    flex: 1,
  },
  savingsTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: '600',
    color: COLORS.surface,
  },
  savingsSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.surface,
    opacity: 0.8,
  },
  savingsAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: COLORS.surface,
    letterSpacing: -1,
  },
  savingsLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.surface,
    opacity: 0.8,
    marginTop: SPACING.xs,
  },
  savingsDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginVertical: SPACING.md,
  },
  monthlySavings: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  monthlyItem: {
    flex: 1,
  },
  monthlyDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: SPACING.md,
  },
  monthlyLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.surface,
    opacity: 0.8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  monthlyAmount: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: '700',
    color: COLORS.surface,
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: SPACING.md,
  },
  statCard: {
    width: '50%',
    paddingVertical: SPACING.xs,
  },
  statCardLeft: {
    paddingRight: SPACING.xs,
  },
  statCardRight: {
    paddingLeft: SPACING.xs,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  statValue: {
    fontSize: TYPOGRAPHY.fontSize.xxl,
    fontWeight: '700',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
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
    alignItems: 'center',
    marginBottom: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  cardTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: '600',
    color: COLORS.text,
    marginLeft: SPACING.sm,
  },
  statusList: {
    gap: SPACING.md,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: SPACING.sm,
  },
  statusLabel: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.text,
  },
  statusValue: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  progressContainer: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  progressBar: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: COLORS.borderLight,
  },
  progressSegment: {
    height: '100%',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.secondary + '10',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.secondary + '30',
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.secondary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: '600',
    color: COLORS.secondary,
    marginBottom: SPACING.xs,
  },
  infoText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
});

export default DashboardScreen;
