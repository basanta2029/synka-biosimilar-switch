import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../constants';
import { switchesApi } from '../../api/switches';
import { Drug, BiosimilarWithSavings, EligibilityResult } from '../../types';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<any, 'SwitchWorkflow'>;

type Step = 'SELECT_DRUG' | 'ELIGIBILITY' | 'SELECT_BIOSIMILAR' | 'CONSENT' | 'CONFIRMATION';

const SwitchWorkflowScreen: React.FC<Props> = ({ navigation, route }) => {
  const { patientId } = route.params;

  const [currentStep, setCurrentStep] = useState<Step>('SELECT_DRUG');
  const [isLoading, setIsLoading] = useState(false);
  const [brandDrugs, setBrandDrugs] = useState<Drug[]>([]);
  const [selectedBrandDrug, setSelectedBrandDrug] = useState<Drug | null>(null);
  const [eligibilityResult, setEligibilityResult] = useState<EligibilityResult | null>(null);
  const [selectedBiosimilar, setSelectedBiosimilar] = useState<BiosimilarWithSavings | null>(null);
  const [consentText, setConsentText] = useState('');
  const [createdSwitch, setCreatedSwitch] = useState<any>(null);

  // Load brand drugs on mount
  useEffect(() => {
    loadBrandDrugs();
  }, []);

  const loadBrandDrugs = async () => {
    setIsLoading(true);
    try {
      const response = await switchesApi.getDrugs('BRAND');
      setBrandDrugs(response.drugs);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to load medications');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectBrandDrug = async (drug: Drug) => {
    setSelectedBrandDrug(drug);
    setIsLoading(true);
    try {
      const result = await switchesApi.checkEligibility(patientId, drug.id);
      setEligibilityResult(result);
      setCurrentStep('ELIGIBILITY');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to check eligibility');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectBiosimilar = (biosimilar: BiosimilarWithSavings) => {
    setSelectedBiosimilar(biosimilar);
    // Pre-populate consent text
    setConsentText(
      `I consent to switching from ${selectedBrandDrug?.name} to ${biosimilar.name}. ` +
      `I understand that ${biosimilar.name} is an FDA-approved ${biosimilar.interchangeability === 'INTERCHANGEABLE' ? 'interchangeable ' : ''}biosimilar ` +
      `that provides the same therapeutic benefit at a lower cost.`
    );
    setCurrentStep('CONSENT');
  };

  const handleRecordConsent = async () => {
    if (!selectedBrandDrug || !selectedBiosimilar) return;

    setIsLoading(true);
    try {
      // Create switch
      const switchResult = await switchesApi.createSwitch({
        patientId,
        fromDrugId: selectedBrandDrug.id,
        toDrugId: selectedBiosimilar.id,
        eligibilityNotes: eligibilityResult?.reasons.join('; '),
      });

      // Record consent
      const consentResult = await switchesApi.recordConsent(switchResult.switch.id, {
        consentText,
        consentObtained: true,
      });

      setCreatedSwitch(consentResult.switch);
      setCurrentStep('CONFIRMATION');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create switch');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const renderStepIndicator = () => {
    const steps = [
      { label: 'Drug', icon: 'package' },
      { label: 'Eligibility', icon: 'check-square' },
      { label: 'Biosimilar', icon: 'shuffle' },
      { label: 'Consent', icon: 'file-text' },
      { label: 'Done', icon: 'check-circle' },
    ];
    const stepMap: Record<Step, number> = {
      'SELECT_DRUG': 0,
      'ELIGIBILITY': 1,
      'SELECT_BIOSIMILAR': 2,
      'CONSENT': 3,
      'CONFIRMATION': 4,
    };
    const currentIndex = stepMap[currentStep];

    return (
      <View style={styles.stepIndicator}>
        {steps.map((step, index) => (
          <View key={step.label} style={styles.stepItem}>
            <View style={[
              styles.stepCircle,
              index <= currentIndex && styles.stepCircleActive,
              index < currentIndex && styles.stepCircleCompleted,
            ]}>
              {index < currentIndex ? (
                <Icon name="check" size={14} color={COLORS.surface} />
              ) : (
                <Icon
                  name={step.icon}
                  size={14}
                  color={index <= currentIndex ? COLORS.surface : COLORS.textSecondary}
                />
              )}
            </View>
            <Text style={[styles.stepLabel, index <= currentIndex && styles.stepLabelActive]}>
              {step.label}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  const renderSelectDrugStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Select Current Medication</Text>
      <Text style={styles.stepDescription}>
        Choose the brand medication the patient is currently taking
      </Text>

      {brandDrugs.map((drug) => (
        <TouchableOpacity
          key={drug.id}
          style={styles.drugCard}
          onPress={() => handleSelectBrandDrug(drug)}
        >
          <View style={styles.drugIconContainer}>
            <Icon name="package" size={20} color={COLORS.primary} />
          </View>
          <View style={styles.drugInfo}>
            <Text style={styles.drugName}>{drug.name}</Text>
            <Text style={styles.drugClass}>{drug.therapeuticClass}</Text>
            <Text style={styles.drugIngredient}>{drug.activeIngredient}</Text>
          </View>
          <View style={styles.drugCost}>
            <Text style={styles.costLabel}>Current Cost</Text>
            <Text style={styles.costValue}>{formatCurrency(drug.costPerMonth)}/mo</Text>
          </View>
          <Icon name="chevron-right" size={20} color={COLORS.textTertiary} />
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderEligibilityStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Eligibility Check</Text>

      {eligibilityResult && (
        <>
          <View style={[
            styles.eligibilityBadge,
            eligibilityResult.eligible ? styles.eligibleBadge : styles.ineligibleBadge,
          ]}>
            <Icon
              name={eligibilityResult.eligible ? 'check-circle' : 'x-circle'}
              size={24}
              color={eligibilityResult.eligible ? COLORS.success : COLORS.error}
            />
            <Text style={[
              styles.eligibilityText,
              { color: eligibilityResult.eligible ? COLORS.success : COLORS.error }
            ]}>
              {eligibilityResult.eligible ? 'Patient Eligible' : 'Not Eligible'}
            </Text>
          </View>

          <View style={styles.currentDrugCard}>
            <View style={styles.sectionHeader}>
              <Icon name="package" size={16} color={COLORS.textSecondary} />
              <Text style={styles.sectionTitle}>Current Medication</Text>
            </View>
            <Text style={styles.drugName}>{eligibilityResult.currentDrug.name}</Text>
            <Text style={styles.drugDetail}>
              {formatCurrency(eligibilityResult.currentDrug.costPerMonth)}/month
            </Text>
          </View>

          {eligibilityResult.warnings.length > 0 && (
            <View style={styles.warningBox}>
              <View style={styles.boxHeader}>
                <Icon name="alert-triangle" size={16} color={COLORS.warning} />
                <Text style={styles.warningTitle}>Warnings</Text>
              </View>
              {eligibilityResult.warnings.map((warning, index) => (
                <View key={index} style={styles.bulletItem}>
                  <View style={styles.bulletDot} />
                  <Text style={styles.warningText}>{warning}</Text>
                </View>
              ))}
            </View>
          )}

          {eligibilityResult.reasons.length > 0 && (
            <View style={styles.infoBox}>
              <View style={styles.boxHeader}>
                <Icon name="info" size={16} color={COLORS.secondary} />
                <Text style={styles.infoTitle}>Information</Text>
              </View>
              {eligibilityResult.reasons.map((reason, index) => (
                <View key={index} style={styles.bulletItem}>
                  <View style={[styles.bulletDot, { backgroundColor: COLORS.secondary }]} />
                  <Text style={styles.infoText}>{reason}</Text>
                </View>
              ))}
            </View>
          )}

          {eligibilityResult.eligible && (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => setCurrentStep('SELECT_BIOSIMILAR')}
            >
              <Text style={styles.primaryButtonText}>
                View {eligibilityResult.recommendedBiosimilars.length} Biosimilar Options
              </Text>
              <Icon name="arrow-right" size={18} color={COLORS.surface} />
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );

  const renderSelectBiosimilarStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Select Biosimilar</Text>
      <Text style={styles.stepDescription}>
        Choose the FDA-approved biosimilar for the switch
      </Text>

      {eligibilityResult?.recommendedBiosimilars.map((biosimilar) => (
        <TouchableOpacity
          key={biosimilar.id}
          style={[
            styles.biosimilarCard,
            biosimilar.interchangeability === 'INTERCHANGEABLE' && styles.interchangeableCard,
          ]}
          onPress={() => handleSelectBiosimilar(biosimilar)}
        >
          {biosimilar.interchangeability === 'INTERCHANGEABLE' && (
            <View style={styles.interchangeableBadge}>
              <Icon name="award" size={12} color={COLORS.success} />
              <Text style={styles.interchangeableText}>FDA INTERCHANGEABLE</Text>
            </View>
          )}

          <View style={styles.biosimilarHeader}>
            <Text style={styles.drugName}>{biosimilar.name}</Text>
            <View style={styles.savingsBadge}>
              <Icon name="trending-down" size={12} color={COLORS.surface} />
              <Text style={styles.savingsPercent}>{biosimilar.savingsPercent}% OFF</Text>
            </View>
          </View>

          <Text style={styles.drugIngredient}>
            {biosimilar.activeIngredient} • {biosimilar.manufacturer}
          </Text>

          <View style={styles.savingsRow}>
            <View style={styles.savingsItem}>
              <Text style={styles.savingsLabel}>New Cost</Text>
              <Text style={styles.savingsValue}>
                {formatCurrency(biosimilar.costPerMonth)}/mo
              </Text>
            </View>
            <View style={styles.savingsItem}>
              <Text style={styles.savingsLabel}>Monthly Savings</Text>
              <Text style={[styles.savingsValue, styles.savingsGreen]}>
                {formatCurrency(biosimilar.monthlySavings)}
              </Text>
            </View>
            <View style={styles.savingsItem}>
              <Text style={styles.savingsLabel}>Annual Savings</Text>
              <Text style={[styles.savingsValue, styles.savingsGreen]}>
                {formatCurrency(biosimilar.annualSavings)}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderConsentStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Patient Consent</Text>

      <View style={styles.switchSummary}>
        <View style={styles.summaryHeader}>
          <Icon name="repeat" size={18} color={COLORS.primary} />
          <Text style={styles.summaryTitle}>Switch Summary</Text>
        </View>
        <View style={styles.switchArrowContainer}>
          <View style={styles.drugPill}>
            <Text style={styles.drugPillText}>{selectedBrandDrug?.name}</Text>
          </View>
          <Icon name="arrow-right" size={20} color={COLORS.primary} />
          <View style={[styles.drugPill, styles.drugPillNew]}>
            <Text style={[styles.drugPillText, { color: COLORS.success }]}>{selectedBiosimilar?.name}</Text>
          </View>
        </View>
        <View style={styles.savingsHighlightContainer}>
          <Icon name="trending-up" size={18} color={COLORS.success} />
          <Text style={styles.savingsHighlight}>
            Saving {formatCurrency(selectedBiosimilar?.annualSavings || 0)}/year
          </Text>
        </View>
      </View>

      <View style={styles.consentSection}>
        <View style={styles.consentLabelRow}>
          <Icon name="file-text" size={16} color={COLORS.text} />
          <Text style={styles.consentLabel}>Consent Statement</Text>
        </View>
        <TextInput
          style={styles.consentInput}
          multiline
          numberOfLines={4}
          value={consentText}
          onChangeText={setConsentText}
          placeholder="Enter consent statement..."
          placeholderTextColor={COLORS.textTertiary}
        />
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, (!consentText || isLoading) && styles.primaryButtonDisabled]}
        onPress={handleRecordConsent}
        disabled={isLoading || !consentText}
      >
        {isLoading ? (
          <ActivityIndicator color={COLORS.surface} />
        ) : (
          <>
            <Icon name="check-circle" size={18} color={COLORS.surface} />
            <Text style={styles.primaryButtonText}>Record Consent & Create Switch</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderConfirmationStep = () => (
    <View style={styles.stepContent}>
      <View style={styles.successIcon}>
        <Icon name="check-circle" size={64} color={COLORS.success} />
      </View>

      <Text style={styles.successTitle}>Switch Created Successfully!</Text>

      <View style={styles.confirmationCard}>
        <View style={styles.confirmationRow}>
          <View style={styles.confirmationItem}>
            <Text style={styles.confirmationLabel}>Switch Details</Text>
            <View style={styles.switchDetailRow}>
              <Text style={styles.confirmationValue}>{createdSwitch?.fromDrug?.name}</Text>
              <Icon name="arrow-right" size={14} color={COLORS.primary} />
              <Text style={[styles.confirmationValue, { color: COLORS.success }]}>
                {createdSwitch?.toDrug?.name}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.confirmationDivider} />

        <View style={styles.confirmationRow}>
          <View style={styles.confirmationItem}>
            <Text style={styles.confirmationLabel}>Status</Text>
            <View style={styles.statusBadge}>
              <Icon name="clock" size={12} color={COLORS.warning} />
              <Text style={styles.statusText}>PENDING</Text>
            </View>
          </View>
        </View>

        <View style={styles.confirmationDivider} />

        <View style={styles.confirmationRow}>
          <View style={styles.confirmationItem}>
            <Text style={styles.confirmationLabel}>Scheduled Follow-ups</Text>
            {createdSwitch?.appointments?.map((apt: any) => (
              <View key={apt.id} style={styles.appointmentItem}>
                <View style={styles.appointmentIconContainer}>
                  <Icon name="calendar" size={14} color={COLORS.primary} />
                </View>
                <View style={styles.appointmentInfo}>
                  <Text style={styles.appointmentType}>
                    {apt.appointmentType === 'DAY_3' ? 'Day 3 Follow-up' : 'Day 14 Follow-up'}
                  </Text>
                  <Text style={styles.appointmentDate}>
                    {new Date(apt.scheduledAt).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => navigation.goBack()}
      >
        <Icon name="arrow-left" size={18} color={COLORS.surface} />
        <Text style={styles.primaryButtonText}>Back to Patient</Text>
      </TouchableOpacity>
    </View>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'SELECT_DRUG':
        return renderSelectDrugStep();
      case 'ELIGIBILITY':
        return renderEligibilityStep();
      case 'SELECT_BIOSIMILAR':
        return renderSelectBiosimilarStep();
      case 'CONSENT':
        return renderConsentStep();
      case 'CONFIRMATION':
        return renderConfirmationStep();
    }
  };

  if (isLoading && currentStep === 'SELECT_DRUG') {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading medications...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {renderStepIndicator()}
      {renderCurrentStep()}

      {currentStep !== 'SELECT_DRUG' && currentStep !== 'CONFIRMATION' && (
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            const steps: Step[] = ['SELECT_DRUG', 'ELIGIBILITY', 'SELECT_BIOSIMILAR', 'CONSENT', 'CONFIRMATION'];
            const currentIndex = steps.indexOf(currentStep);
            if (currentIndex > 0) {
              setCurrentStep(steps[currentIndex - 1]);
            }
          }}
        >
          <Icon name="arrow-left" size={18} color={COLORS.primary} />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.lg,
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
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xl,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  stepCircleActive: {
    backgroundColor: COLORS.primary,
  },
  stepCircleCompleted: {
    backgroundColor: COLORS.success,
  },
  stepLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textTertiary,
  },
  stepLabelActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  stepContent: {
    marginBottom: SPACING.lg,
  },
  stepTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  stepDescription: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  drugCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  drugIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  drugInfo: {
    flex: 1,
  },
  drugName: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  drugClass: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.primary,
    marginTop: 2,
  },
  drugIngredient: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  drugDetail: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  drugCost: {
    alignItems: 'flex-end',
    marginRight: SPACING.sm,
  },
  costLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
  },
  costValue: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: '700',
    color: COLORS.error,
  },
  eligibilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  eligibleBadge: {
    backgroundColor: COLORS.successLight,
  },
  ineligibleBadge: {
    backgroundColor: COLORS.errorLight,
  },
  eligibilityText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: '700',
  },
  currentDrugCard: {
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  warningBox: {
    backgroundColor: COLORS.warningLight,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md,
  },
  boxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  warningTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: '600',
    color: COLORS.warning,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.xs,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.warning,
    marginTop: 6,
    marginRight: SPACING.sm,
  },
  warningText: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text,
  },
  infoBox: {
    backgroundColor: COLORS.secondary + '10',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.lg,
  },
  infoTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: '600',
    color: COLORS.secondary,
  },
  infoText: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text,
  },
  biosimilarCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  interchangeableCard: {
    borderColor: COLORS.success,
    borderWidth: 2,
  },
  interchangeableBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.successLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    alignSelf: 'flex-start',
    marginBottom: SPACING.sm,
    gap: SPACING.xs,
  },
  interchangeableText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: '700',
    color: COLORS.success,
  },
  biosimilarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  savingsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.success,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    gap: 4,
  },
  savingsPercent: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '700',
    color: COLORS.surface,
  },
  savingsRow: {
    flexDirection: 'row',
    marginTop: SPACING.md,
  },
  savingsItem: {
    flex: 1,
  },
  savingsLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
  },
  savingsValue: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: '700',
    color: COLORS.text,
  },
  savingsGreen: {
    color: COLORS.success,
  },
  switchSummary: {
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    alignItems: 'center',
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  summaryTitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  switchArrowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  drugPill: {
    backgroundColor: COLORS.surfaceAlt,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  drugPillNew: {
    backgroundColor: COLORS.successLight,
  },
  drugPillText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  savingsHighlightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  savingsHighlight: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: '700',
    color: COLORS.success,
  },
  consentSection: {
    marginBottom: SPACING.lg,
  },
  consentLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  consentLabel: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  consentInput: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.text,
    textAlignVertical: 'top',
    minHeight: 120,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    gap: SPACING.sm,
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: COLORS.surface,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: '600',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    gap: SPACING.xs,
  },
  backButtonText: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: '500',
  },
  successIcon: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  successTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: '700',
    color: COLORS.success,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  confirmationCard: {
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  confirmationRow: {
    paddingVertical: SPACING.sm,
  },
  confirmationDivider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
  },
  confirmationItem: {},
  confirmationLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  confirmationValue: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  switchDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.warningLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    alignSelf: 'flex-start',
    gap: SPACING.xs,
  },
  statusText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '700',
    color: COLORS.warning,
  },
  appointmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  appointmentIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  appointmentInfo: {
    flex: 1,
  },
  appointmentType: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: '500',
    color: COLORS.text,
  },
  appointmentDate: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});

export default SwitchWorkflowScreen;
