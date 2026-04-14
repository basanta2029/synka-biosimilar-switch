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
  Modal,
  DeviceEventEmitter,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import QRCode from 'react-native-qrcode-svg';
import NetInfo from '@react-native-community/netinfo';
import {
  COLORS,
  SPACING,
  TYPOGRAPHY,
  BORDER_RADIUS,
  CLINICAL_PROFILE,
  GHANA_TARGET_INGREDIENTS,
  API_CONFIG,
} from '../../constants';
import { switchesApi } from '../../api/switches';
import { patientsApi } from '../../api/patients';
import { patientsDb } from '../../database';
import { Drug, BiosimilarWithSavings, EligibilityResult } from '../../types';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { syncService } from '../../services/syncService';

type Props = NativeStackScreenProps<any, 'SwitchWorkflow'>;

type Step =
  | 'SELECT_DRUG'
  | 'SELECT_BIOSIMILAR'
  | 'SCHEDULE'
  | 'CONSENT'
  | 'CONFIRMATION';

const SwitchWorkflowScreen: React.FC<Props> = ({ navigation, route }) => {
  const { patientId } = route.params;

  const [currentStep, setCurrentStep] = useState<Step>('SELECT_DRUG');
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingEligibility, setIsCheckingEligibility] = useState(false);
  const [showEligibilityModal, setShowEligibilityModal] = useState(false);
  const [brandDrugs, setBrandDrugs] = useState<Drug[]>([]);
  const [selectedBrandDrug, setSelectedBrandDrug] = useState<Drug | null>(null);
  const [eligibilityResult, setEligibilityResult] = useState<EligibilityResult | null>(null);
  /** Per-drug eligibility from completed checks only (same API response as the detail panel). */
  const [eligibilityByDrugId, setEligibilityByDrugId] = useState<Record<string, boolean>>({});
  const [selectedBiosimilar, setSelectedBiosimilar] = useState<BiosimilarWithSavings | null>(null);
  const [consentText, setConsentText] = useState('');
  const [createdSwitch, setCreatedSwitch] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [specialistVerified, setSpecialistVerified] = useState(false);
  const [nhisChecked, setNhisChecked] = useState(false);
  const [stabilityReviewed, setStabilityReviewed] = useState(false);

  // Simple appointment schedule state (initial/day3/day14)
  const [initialDate] = useState<Date>(new Date());
  const [day3Date] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d;
  });
  const [day14Date] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d;
  });

  // Load brand drugs on mount
  useEffect(() => {
    loadBrandDrugs();
  }, []);

  const loadBrandDrugs = async () => {
    setIsLoading(true);
    try {
      const response = await switchesApi.getDrugs('BRAND');
      const ghanaBrandDrugs = response.drugs.filter((drug: Drug) => {
        const ingredient = (drug.activeIngredient || '').toLowerCase();
        return GHANA_TARGET_INGREDIENTS.some(target => ingredient.includes(target));
      });
      setBrandDrugs(ghanaBrandDrugs);
    } catch (error: any) {
      console.error('Failed to load medications', error);
      Alert.alert('Error', 'Failed to load medications');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectBrandDrug = async (drug: Drug) => {
    setSelectedBrandDrug(drug);
    setEligibilityResult(null);
    setIsCheckingEligibility(true);
    setShowEligibilityModal(true);
    try {
      const netState = await NetInfo.fetch();
      if (netState.isConnected) {
        // Push latest local patient data directly to the server before eligibility check
        const localPatient = await patientsDb.getById(patientId);
        if (localPatient) {
          try {
            await patientsApi.updatePatient(patientId, {
              name: localPatient.name,
              phone: localPatient.phone,
              dateOfBirth: localPatient.dateOfBirth,
              language: localPatient.language,
              diagnosis: localPatient.diagnosis || undefined,
              allergies: localPatient.allergies || undefined,
            });
            await patientsDb.markAsSynced(patientId);
          } catch (syncErr: any) {
            // If 404, patient doesn't exist on server yet — create it
            if (syncErr?.response?.status === 404) {
              try {
                await patientsApi.createPatient({
                  id: patientId,
                  name: localPatient.name,
                  phone: localPatient.phone,
                  dateOfBirth: localPatient.dateOfBirth,
                  language: localPatient.language,
                  diagnosis: localPatient.diagnosis || undefined,
                  allergies: localPatient.allergies || undefined,
                });
                await patientsDb.markAsSynced(patientId);
              } catch (createErr: any) {
                console.warn('Pre-eligibility patient create failed:', createErr?.response?.data || createErr.message);
              }
            } else {
              console.warn('Pre-eligibility patient sync failed:', syncErr?.response?.data || syncErr.message);
            }
          }
        }
        await syncService.syncAll();
      }
      const result = await switchesApi.checkEligibility(patientId, drug.id);
      setEligibilityResult(result);
      setEligibilityByDrugId((prev) => ({ ...prev, [drug.id]: result.eligible }));
    } catch (error: any) {
      console.error('Failed to check eligibility', error);
      setShowEligibilityModal(false);
      const netCheck = await NetInfo.fetch();
      if (!netCheck.isConnected) {
        Alert.alert(
          'No Connection',
          'Eligibility check requires an internet connection. Please connect and try again.'
        );
      } else {
        const apiMessage = error?.response?.data?.message;
        Alert.alert(
          'Error',
          apiMessage ||
            error.message ||
            'Failed to check eligibility. If this patient was created offline, sync first then try again.'
        );
      }
    } finally {
      setIsCheckingEligibility(false);
    }
  };

  const handleSelectBiosimilar = (biosimilar: BiosimilarWithSavings) => {
    setSelectedBiosimilar(biosimilar);
    // Pre-populate consent text
    setConsentText(
      `I consent to switching from ${selectedBrandDrug?.name} to ${biosimilar.name}. ` +
      `I understand that ${biosimilar.name} is a biosimilar medicine evaluated under Ghana FDA guidelines ` +
      `and that my prescriber has determined this switch will provide the same therapeutic benefit.`
    );
    setCurrentStep('SCHEDULE');
  };

  const handleSubmitSwitch = async () => {
    if (!selectedBrandDrug || !selectedBiosimilar) {
      return;
    }

    if (!specialistVerified || !nhisChecked || !stabilityReviewed) {
      Alert.alert(
        'Checklist Required',
        'Please complete the Ghana clinical checklist before submitting the switch.'
      );
      return;
    }

    if (!consentText.trim()) {
      Alert.alert('Consent Required', 'Please review and confirm the consent statement.');
      return;
    }

    setIsSubmitting(true);
    try {
      const createRequest = {
        patientId,
        fromDrugId: selectedBrandDrug.id,
        toDrugId: selectedBiosimilar.id,
        eligibilityNotes: [
          `CLINICAL_PROFILE=${CLINICAL_PROFILE.id}`,
          'SPECIALIST_INITIATION_CONFIRMED=true',
          'NHIS_REIMBURSEMENT_CHECKED=true',
          'CLINICAL_STABILITY_REVIEWED=true',
        ].join('; '),
        // Optional schedule metadata for backend to use when available
        schedule: {
          initial: initialDate.toISOString(),
          day3: day3Date.toISOString(),
          day14: day14Date.toISOString(),
        },
      };

      const consentRequest = {
        consentText,
        consentObtained: true,
      };

      const netState = await NetInfo.fetch();

      if (netState.isConnected) {
        // Online: create switch immediately
        const switchResult = await switchesApi.createSwitch(createRequest as any);
        const consentResult = await switchesApi.recordConsent(
          switchResult.switch.id,
          consentRequest
        );
        setCreatedSwitch(consentResult.switch);
        setCurrentStep('CONFIRMATION');
        DeviceEventEmitter.emit('dashboard-refresh');
      } else {
        // Offline: queue for later sync
        await syncService.queueSwitchCreate(createRequest as any, consentRequest);
        Alert.alert(
          'Offline',
          'Switch created locally – will sync when online.'
        );
        setCreatedSwitch({
          fromDrug: selectedBrandDrug,
          toDrug: selectedBiosimilar,
          status: 'PENDING',
          appointments: [
            { id: 'INITIAL', appointmentType: 'INITIAL', scheduledAt: initialDate.toISOString() },
            { id: 'DAY_3', appointmentType: 'DAY_3', scheduledAt: day3Date.toISOString() },
            { id: 'DAY_14', appointmentType: 'DAY_14', scheduledAt: day14Date.toISOString() },
          ],
        });
        setCurrentStep('CONFIRMATION');
        DeviceEventEmitter.emit('dashboard-refresh');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create switch');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNhisStatus = (biosimilar: BiosimilarWithSavings) => {
    const status = biosimilar.nhisCoverage?.verificationStatus;
    if (status === 'MATCHED_NHIS_2025') {
      return 'NHIS 2025 MATCHED';
    }
    if (status === 'NEEDS_MANUAL_REVIEW') {
      return 'NHIS REVIEW NEEDED';
    }
    return 'NOT IN NHIS 2025';
  };

  const formatMessage = (message: string) => {
    const [code, ...rest] = message.split(':');
    if (!rest.length) return message;
    const label = code.replace(/_/g, ' ');
    return `${label}: ${rest.join(':').trim()}`;
  };

  /**
   * Side badge uses the same `eligible` flag as the expanded panel: live result while selected,
   * otherwise the last successful check cached for that drug id.
   */
  const getEligibilityForDrugRow = (drug: Drug): boolean | undefined => {
    if (selectedBrandDrug?.id === drug.id && eligibilityResult) {
      return eligibilityResult.eligible;
    }
    if (Object.prototype.hasOwnProperty.call(eligibilityByDrugId, drug.id)) {
      return eligibilityByDrugId[drug.id];
    }
    return undefined;
  };

  const renderMedicationEligibilityBadge = (drug: Drug) => {
    const eligible = getEligibilityForDrugRow(drug);
    if (eligible === undefined) {
      return null;
    }

    return (
      <View
        style={[
          styles.drugStatusBadge,
          eligible ? styles.drugStatusBadgeYes : styles.drugStatusBadgeNo,
        ]}
        accessibilityRole="text"
        accessibilityLabel={eligible ? 'Eligible for switch' : 'Not eligible for switch'}
      >
        <Icon
          name={eligible ? 'check-circle' : 'x-circle'}
          size={12}
          color={eligible ? COLORS.success : COLORS.error}
        />
        <Text
          style={[
            styles.drugStatusBadgeText,
            eligible ? styles.drugStatusBadgeTextYes : styles.drugStatusBadgeTextNo,
          ]}
          numberOfLines={1}
        >
          {eligible ? 'Eligible' : 'Not eligible'}
        </Text>
      </View>
    );
  };

  const renderStepIndicator = () => {
    const steps = [
      { label: 'Drug', icon: 'package' },
      { label: 'Eligibility', icon: 'check-square' },
      { label: 'Biosimilar', icon: 'shuffle' },
      { label: 'Schedule', icon: 'calendar' },
      { label: 'Consent', icon: 'file-text' },
      { label: 'Summary', icon: 'check-circle' },
    ];
    const stepMap: Record<Step, number> = {
      'SELECT_DRUG': 0,
      'SELECT_BIOSIMILAR': 2,
      'SCHEDULE': 3,
      'CONSENT': 4,
      'CONFIRMATION': 5,
    };
    const currentIndex =
      currentStep === 'SELECT_DRUG' && eligibilityResult ? 1 : stepMap[currentStep];

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

  const renderEligibilityModal = () => (
    <Modal
      visible={showEligibilityModal}
      animationType="slide"
      transparent
      onRequestClose={() => setShowEligibilityModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          {/* Header bar */}
          <View style={styles.modalHandle} />

          {isCheckingEligibility ? (
            <View style={styles.modalLoading}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.modalLoadingText}>Checking eligibility…</Text>
            </View>
          ) : eligibilityResult ? (
            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
              {/* Status banner */}
              <View style={[
                styles.eligibilityBadge,
                eligibilityResult.eligible ? styles.eligibleBadge : styles.ineligibleBadge,
              ]}>
                <Icon
                  name={eligibilityResult.eligible ? 'check-circle' : 'x-circle'}
                  size={22}
                  color={eligibilityResult.eligible ? COLORS.success : COLORS.error}
                />
                <Text style={[
                  styles.eligibilityText,
                  { color: eligibilityResult.eligible ? COLORS.success : COLORS.error }
                ]}>
                  {eligibilityResult.eligible ? 'Patient Eligible' : 'Not Eligible'}
                </Text>
              </View>

              {/* Selected drug */}
              <View style={styles.currentDrugCard}>
                <View style={styles.sectionHeader}>
                  <Icon name="package" size={16} color={COLORS.textSecondary} />
                  <Text style={styles.sectionTitle}>Selected medication</Text>
                </View>
                <Text style={styles.drugName}>{eligibilityResult.currentDrug.name}</Text>
                <Text style={styles.drugDetail}>
                  {formatCurrency(eligibilityResult.currentDrug.costPerMonth)}/month
                </Text>
              </View>

              {/* Warnings */}
              {eligibilityResult.warnings.length > 0 && (
                <View style={styles.warningBox}>
                  <View style={styles.boxHeader}>
                    <Icon name="alert-triangle" size={16} color={COLORS.warning} />
                    <Text style={styles.warningTitle}>Warnings</Text>
                  </View>
                  {eligibilityResult.warnings.map((warning, index) => (
                    <View key={index} style={styles.bulletItem}>
                      <View style={styles.bulletDot} />
                      <Text style={styles.warningText}>{formatMessage(warning)}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Blocking Reasons */}
              {eligibilityResult.reasons.length > 0 && (
                <View style={styles.infoBox}>
                  <View style={styles.boxHeader}>
                    <Icon name="x-circle" size={16} color={COLORS.error} />
                    <Text style={styles.infoTitle}>Blocking Reasons</Text>
                  </View>
                  {eligibilityResult.reasons.map((reason, index) => (
                    <View key={index} style={styles.bulletItem}>
                      <View style={[styles.bulletDot, { backgroundColor: COLORS.secondary }]} />
                      <Text style={styles.infoText}>{formatMessage(reason)}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Action buttons */}
              {eligibilityResult.eligible && (
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => {
                    setShowEligibilityModal(false);
                    setCurrentStep('SELECT_BIOSIMILAR');
                  }}
                >
                  <Text style={styles.primaryButtonText}>
                    View {eligibilityResult.recommendedBiosimilars.length} Biosimilar Options
                  </Text>
                  <Icon name="arrow-right" size={18} color={COLORS.surface} />
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowEligibilityModal(false)}
              >
                <Text style={styles.modalCloseButtonText}>Close</Text>
              </TouchableOpacity>
            </ScrollView>
          ) : null}
        </View>
      </View>
    </Modal>
  );

  const renderSelectDrugStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Select Current Medication</Text>
      {!eligibilityResult && (
        <Text style={styles.stepDescription}>
          Tap a medication to check eligibility.
        </Text>
      )}
      <View style={styles.profileBanner}>
        <Icon name="map-pin" size={14} color={COLORS.primary} />
        <Text style={styles.profileBannerText}>
          {CLINICAL_PROFILE.label} ({CLINICAL_PROFILE.region}) · Ghana workflow · NHIS 2025
        </Text>
      </View>

      {brandDrugs.map((drug) => {
        const isSelected = selectedBrandDrug?.id === drug.id;
        const isBusy = isCheckingEligibility && isSelected;
        return (
          <TouchableOpacity
            key={drug.id}
            style={[styles.drugCard, isSelected && styles.drugCardSelected]}
            onPress={() => handleSelectBrandDrug(drug)}
            disabled={isCheckingEligibility}
            activeOpacity={0.7}
          >
            {/* Top row: icon, name + class, cost + chevron */}
            <View style={styles.drugCardRow}>
              <View style={styles.drugIconContainer}>
                <Icon name="package" size={18} color={COLORS.primary} />
              </View>
              <View style={styles.drugInfo}>
                <Text style={styles.drugName} numberOfLines={1}>{drug.name}</Text>
                <Text style={styles.drugClass} numberOfLines={1}>{drug.therapeuticClass}</Text>
              </View>
              <View style={styles.drugCost}>
                <Text style={styles.costValue}>{formatCurrency(drug.costPerMonth)}/mo</Text>
              </View>
              <Icon name="chevron-right" size={18} color={COLORS.textTertiary} style={{ marginLeft: 4 }} />
            </View>

            {/* Bottom row: ingredient + eligibility badge */}
            <View style={styles.drugCardBottomRow}>
              <Text style={styles.drugIngredient} numberOfLines={1}>{drug.activeIngredient}</Text>
              {isBusy ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                renderMedicationEligibilityBadge(drug)
              )}
            </View>
          </TouchableOpacity>
        );
      })}

      {renderEligibilityModal()}
    </View>
  );

  const renderSelectBiosimilarStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Select Biosimilar</Text>
      <Text style={styles.stepDescription}>
        Choose a Ghana prototype biosimilar option. NHIS-matched entries show verified NHIS 2025 pricing.
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
              <Text style={styles.interchangeableText}>CLINIC PREFERRED</Text>
            </View>
          )}

          <View style={styles.biosimilarHeader}>
            <Text style={styles.drugName}>{biosimilar.name}</Text>
            <View style={styles.savingsBadge}>
              <Icon name="trending-down" size={12} color={COLORS.surface} />
              <Text style={styles.savingsPercent}>{biosimilar.savingsPercent}% OFF</Text>
            </View>
          </View>
          <View style={styles.nhisTagRow}>
            <View
              style={[
                styles.nhisTag,
                biosimilar.nhisCoverage?.isListed ? styles.nhisTagMatched : styles.nhisTagUnmatched,
              ]}
            >
              <Text
                style={[
                  styles.nhisTagText,
                  biosimilar.nhisCoverage?.isListed ? styles.nhisTagTextMatched : styles.nhisTagTextUnmatched,
                ]}
              >
                {formatNhisStatus(biosimilar)}
              </Text>
            </View>
          </View>

          <Text style={styles.drugIngredient}>
            {biosimilar.activeIngredient} • {biosimilar.manufacturer}
          </Text>

          <View style={styles.savingsRow}>
            <View style={styles.savingsItem}>
              <Text style={styles.savingsLabel}>
                {biosimilar.nhisCoverage?.isListed ? 'NHIS Cost' : 'Prototype Cost'}
              </Text>
              <Text style={styles.savingsValue}>
                {biosimilar.nhisCoverage?.pricing?.priceGhs != null
                  ? `${formatCurrency(biosimilar.nhisCoverage.pricing.priceGhs)}/${biosimilar.nhisCoverage.pricing.unitOfPricing}`
                  : `${formatCurrency(biosimilar.costPerMonth)}/mo`}
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

  const renderScheduleStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Schedule Follow-ups</Text>
      <Text style={styles.stepDescription}>
        Confirm the initial visit and automatic day 3/day 14 follow-up schedule.
      </Text>

      <View style={styles.currentDrugCard}>
        <View style={styles.sectionHeader}>
          <Icon name="calendar" size={16} color={COLORS.textSecondary} />
          <Text style={styles.sectionTitle}>Appointments</Text>
        </View>

        <View style={styles.appointmentRow}>
          <Text style={styles.appointmentLabel}>Initial Visit</Text>
          <Text style={styles.appointmentValue}>
            {initialDate.toLocaleDateString()} • {initialDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        <View style={styles.appointmentRow}>
          <Text style={styles.appointmentLabel}>Day 3 Follow-up</Text>
          <Text style={styles.appointmentValue}>
            {day3Date.toLocaleDateString()} • {day3Date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        <View style={styles.appointmentRow}>
          <Text style={styles.appointmentLabel}>Day 14 Follow-up</Text>
          <Text style={styles.appointmentValue}>
            {day14Date.toLocaleDateString()} • {day14Date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>

      <View style={styles.currentDrugCard}>
        <View style={styles.sectionHeader}>
          <Icon name="shield" size={16} color={COLORS.textSecondary} />
          <Text style={styles.sectionTitle}>Ghana Prescribing Checklist</Text>
        </View>

        <TouchableOpacity
          style={styles.checklistRow}
          onPress={() => setSpecialistVerified(!specialistVerified)}
        >
          <Icon
            name={specialistVerified ? 'check-square' : 'square'}
            size={18}
            color={specialistVerified ? COLORS.success : COLORS.textSecondary}
          />
          <Text style={styles.checklistText}>
            Specialist initiation confirmed (SM/specialist pathway)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.checklistRow}
          onPress={() => setNhisChecked(!nhisChecked)}
        >
          <Icon
            name={nhisChecked ? 'check-square' : 'square'}
            size={18}
            color={nhisChecked ? COLORS.success : COLORS.textSecondary}
          />
          <Text style={styles.checklistText}>
            NHIS listing/reimbursement checked for selected biosimilar
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.checklistRow}
          onPress={() => setStabilityReviewed(!stabilityReviewed)}
        >
          <Icon
            name={stabilityReviewed ? 'check-square' : 'square'}
            size={18}
            color={stabilityReviewed ? COLORS.success : COLORS.textSecondary}
          />
          <Text style={styles.checklistText}>
            Clinical stability reviewed before switch decision
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => {
          if (!specialistVerified || !nhisChecked || !stabilityReviewed) {
            Alert.alert(
              'Checklist Required',
              'Please complete all Ghana checklist items before continuing.'
            );
            return;
          }
          setCurrentStep('CONSENT');
        }}
      >
        <Text style={styles.primaryButtonText}>Continue to Consent</Text>
        <Icon name="arrow-right" size={18} color={COLORS.surface} />
      </TouchableOpacity>
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
        style={[
          styles.primaryButton,
          (!consentText || isSubmitting) && styles.primaryButtonDisabled,
        ]}
        onPress={handleSubmitSwitch}
        disabled={isSubmitting || !consentText}
      >
        {isSubmitting ? (
          <ActivityIndicator color={COLORS.surface} />
        ) : (
          <>
            <Icon name="check-circle" size={18} color={COLORS.surface} />
            <Text style={styles.primaryButtonText}>Submit Switch</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderConfirmationStep = () => {
    const token = createdSwitch?.patientAccessToken;
    const patientPageUrl = token ? `${API_CONFIG.PUBLIC_HOST}/patient/switch/${token}` : null;

    return (
      <View style={styles.stepContent}>
        <View style={styles.successIcon}>
          <Icon name="check-circle" size={64} color={COLORS.success} />
        </View>

        <Text style={styles.successTitle}>Switch Created Successfully!</Text>

        {patientPageUrl ? (
          <View style={styles.qrCard}>
            <Text style={styles.qrTitle}>Share with Patient</Text>
            <Text style={styles.qrSubtitle}>
              Patient can scan this QR code to view their medication switch details and follow-up schedule
            </Text>
            <View style={styles.qrContainer}>
              <QRCode
                value={patientPageUrl}
                size={180}
                color={COLORS.text}
                backgroundColor={COLORS.surface}
              />
            </View>
          </View>
        ) : (
          <View style={styles.qrCard}>
            <Icon name="wifi-off" size={20} color={COLORS.textSecondary} />
            <Text style={styles.qrSubtitle}>
              QR code will be available once this switch syncs to the server
            </Text>
          </View>
        )}

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
                      {apt.appointmentType === 'INITIAL'
                        ? 'Initial Visit'
                        : apt.appointmentType === 'DAY_3'
                          ? 'Day 3 Follow-up'
                          : 'Day 14 Follow-up'}
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
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'SELECT_DRUG':
        return renderSelectDrugStep();
      case 'SELECT_BIOSIMILAR':
        return renderSelectBiosimilarStep();
      case 'SCHEDULE':
        return renderScheduleStep();
      case 'CONSENT':
        return renderConsentStep();
      case 'CONFIRMATION':
        return renderConfirmationStep();
    }
  };

  if (isLoading && brandDrugs.length === 0) {
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

      {((currentStep !== 'SELECT_DRUG' && currentStep !== 'CONFIRMATION') ||
        (currentStep === 'SELECT_DRUG' && eligibilityResult)) && (
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (currentStep === 'SELECT_DRUG' && eligibilityResult) {
              setEligibilityResult(null);
              setSelectedBrandDrug(null);
              return;
            }
            const steps: Step[] = [
              'SELECT_DRUG',
              'SELECT_BIOSIMILAR',
              'SCHEDULE',
              'CONSENT',
              'CONFIRMATION',
            ];
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
  profileBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.primary + '10',
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
    padding: SPACING.sm,
    marginBottom: SPACING.md,
  },
  profileBannerText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.primaryDark,
    fontWeight: '600',
  },
  drugCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  drugCardSelected: {
    borderColor: COLORS.primary,
    borderWidth: 2,
    backgroundColor: COLORS.primary + '06',
  },
  drugCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  drugCardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingLeft: 46,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
    maxHeight: '85%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.borderLight,
    alignSelf: 'center',
    marginBottom: SPACING.md,
  },
  modalLoading: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl,
    gap: SPACING.md,
  },
  modalLoadingText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
  },
  modalCloseButton: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
    marginTop: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    backgroundColor: COLORS.surface,
  },
  modalCloseButtonText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  drugIconContainer: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  drugInfo: {
    flex: 1,
    minWidth: 0,
  },
  drugStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
    gap: 4,
  },
  drugStatusBadgeYes: {
    backgroundColor: COLORS.success + '18',
  },
  drugStatusBadgeNo: {
    backgroundColor: COLORS.error + '18',
  },
  drugStatusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  drugStatusBadgeTextYes: {
    color: COLORS.success,
  },
  drugStatusBadgeTextNo: {
    color: COLORS.error,
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
    marginRight: 2,
  },
  costValue: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '700',
    color: COLORS.error,
  },
  eligibilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  eligibleBadge: {
    backgroundColor: COLORS.successLight,
  },
  ineligibleBadge: {
    backgroundColor: COLORS.errorLight,
  },
  eligibilityText: {
    fontSize: TYPOGRAPHY.fontSize.md,
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
  appointmentRow: {
    paddingVertical: SPACING.xs,
  },
  appointmentLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  appointmentValue: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.text,
    fontWeight: '500',
  },
  checklistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
  },
  checklistText: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text,
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
  nhisTagRow: {
    marginTop: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  nhisTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
  },
  nhisTagMatched: {
    backgroundColor: COLORS.successLight,
    borderColor: COLORS.success,
  },
  nhisTagUnmatched: {
    backgroundColor: COLORS.warningLight,
    borderColor: COLORS.warning,
  },
  nhisTagText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: '700',
  },
  nhisTagTextMatched: {
    color: COLORS.success,
  },
  nhisTagTextUnmatched: {
    color: COLORS.warning,
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
  qrCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  qrTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  qrSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.md,
    lineHeight: 20,
  },
  qrContainer: {
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
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
