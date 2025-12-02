import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SEVERITY } from '../../constants';
import { switchesApi, FollowUpRequest } from '../../api/switches';

interface Appointment {
  id: string;
  appointmentType: 'DAY_3' | 'DAY_14';
  patient: {
    name: string;
  };
  switch: {
    fromDrug: { name: string };
    toDrug: { name: string };
  };
}

interface FollowUpFormModalProps {
  visible: boolean;
  appointment: Appointment | null;
  onClose: () => void;
  onSuccess: () => void;
}

type SeverityLevel = 'MILD' | 'MODERATE' | 'SEVERE';

const FollowUpFormModal: React.FC<FollowUpFormModalProps> = ({
  visible,
  appointment,
  onClose,
  onSuccess,
}) => {
  const [hasSideEffects, setHasSideEffects] = useState<boolean | null>(null);
  const [sideEffectSeverity, setSideEffectSeverity] = useState<SeverityLevel | null>(null);
  const [sideEffectDescription, setSideEffectDescription] = useState('');
  const [stillTakingMedication, setStillTakingMedication] = useState<boolean | null>(null);
  const [patientSatisfaction, setPatientSatisfaction] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setHasSideEffects(null);
    setSideEffectSeverity(null);
    setSideEffectDescription('');
    setStillTakingMedication(null);
    setPatientSatisfaction(null);
    setNotes('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const isFormValid = () => {
    if (hasSideEffects === null || stillTakingMedication === null) {
      return false;
    }
    if (hasSideEffects && !sideEffectSeverity) {
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!appointment || !isFormValid()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const data: FollowUpRequest = {
        hasSideEffects: hasSideEffects!,
        stillTakingMedication: stillTakingMedication!,
      };

      if (hasSideEffects && sideEffectSeverity) {
        data.sideEffectSeverity = sideEffectSeverity;
        if (sideEffectDescription.trim()) {
          data.sideEffectDescription = sideEffectDescription.trim();
        }
      }

      if (patientSatisfaction !== null) {
        data.patientSatisfaction = patientSatisfaction;
      }

      if (notes.trim()) {
        data.notes = notes.trim();
      }

      await switchesApi.recordFollowUp(appointment.id, data);

      Alert.alert(
        'Success',
        'Follow-up has been recorded successfully',
        [{ text: 'OK', onPress: () => {
          resetForm();
          onSuccess();
        }}]
      );
    } catch (error: any) {
      console.error('Error recording follow-up:', error);
      Alert.alert('Error', error.message || 'Failed to record follow-up');
    } finally {
      setIsSubmitting(false);
    }
  };

  const YesNoButton = ({
    label,
    value,
    selectedValue,
    onSelect,
  }: {
    label: string;
    value: boolean;
    selectedValue: boolean | null;
    onSelect: (value: boolean) => void;
  }) => {
    const isSelected = selectedValue === value;
    return (
      <TouchableOpacity
        style={[styles.yesNoButton, isSelected && styles.yesNoButtonSelected]}
        onPress={() => onSelect(value)}
      >
        <Icon
          name={value ? 'check' : 'x'}
          size={16}
          color={isSelected ? COLORS.surface : COLORS.textSecondary}
        />
        <Text style={[styles.yesNoText, isSelected && styles.yesNoTextSelected]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const SeverityButton = ({ severity }: { severity: SeverityLevel }) => {
    const isSelected = sideEffectSeverity === severity;
    const colors: Record<SeverityLevel, string> = {
      MILD: COLORS.success,
      MODERATE: COLORS.warning,
      SEVERE: COLORS.error,
    };

    return (
      <TouchableOpacity
        style={[
          styles.severityButton,
          isSelected && { backgroundColor: colors[severity] + '20', borderColor: colors[severity] },
        ]}
        onPress={() => setSideEffectSeverity(severity)}
      >
        <Text
          style={[
            styles.severityText,
            isSelected && { color: colors[severity], fontWeight: '600' },
          ]}
        >
          {severity}
        </Text>
      </TouchableOpacity>
    );
  };

  const SatisfactionButton = ({ rating }: { rating: number }) => {
    const isSelected = patientSatisfaction === rating;
    const emojis = ['😞', '😕', '😐', '🙂', '😊'];

    return (
      <TouchableOpacity
        style={[styles.satisfactionButton, isSelected && styles.satisfactionButtonSelected]}
        onPress={() => setPatientSatisfaction(rating)}
      >
        <Text style={styles.satisfactionEmoji}>{emojis[rating - 1]}</Text>
        <Text style={[styles.satisfactionRating, isSelected && styles.satisfactionRatingSelected]}>
          {rating}
        </Text>
      </TouchableOpacity>
    );
  };

  if (!appointment) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Complete Follow-up</Text>
              <Text style={styles.subtitle}>
                {appointment.appointmentType === 'DAY_3' ? 'Day 3' : 'Day 14'} Check-in
              </Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Icon name="x" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Patient Info */}
            <View style={styles.patientCard}>
              <View style={styles.patientRow}>
                <Icon name="user" size={16} color={COLORS.primary} />
                <Text style={styles.patientName}>{appointment.patient.name}</Text>
              </View>
              <View style={styles.patientRow}>
                <Icon name="repeat" size={14} color={COLORS.textSecondary} />
                <Text style={styles.switchInfo}>
                  {appointment.switch.fromDrug.name} → {appointment.switch.toDrug.name}
                </Text>
              </View>
            </View>

            {/* Side Effects Question */}
            <View style={styles.section}>
              <Text style={styles.questionLabel}>
                Any side effects reported? <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.yesNoContainer}>
                <YesNoButton
                  label="Yes"
                  value={true}
                  selectedValue={hasSideEffects}
                  onSelect={setHasSideEffects}
                />
                <YesNoButton
                  label="No"
                  value={false}
                  selectedValue={hasSideEffects}
                  onSelect={(val) => {
                    setHasSideEffects(val);
                    setSideEffectSeverity(null);
                    setSideEffectDescription('');
                  }}
                />
              </View>
            </View>

            {/* Severity (conditional) */}
            {hasSideEffects && (
              <View style={styles.section}>
                <Text style={styles.questionLabel}>
                  Side effect severity <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.severityContainer}>
                  <SeverityButton severity="MILD" />
                  <SeverityButton severity="MODERATE" />
                  <SeverityButton severity="SEVERE" />
                </View>

                <Text style={[styles.questionLabel, { marginTop: SPACING.md }]}>
                  Describe side effects
                </Text>
                <TextInput
                  style={styles.textArea}
                  placeholder="E.g., injection site reaction, headache, fatigue..."
                  placeholderTextColor={COLORS.textTertiary}
                  multiline
                  numberOfLines={3}
                  value={sideEffectDescription}
                  onChangeText={setSideEffectDescription}
                />
              </View>
            )}

            {/* Still Taking Medication */}
            <View style={styles.section}>
              <Text style={styles.questionLabel}>
                Still taking the biosimilar? <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.yesNoContainer}>
                <YesNoButton
                  label="Yes"
                  value={true}
                  selectedValue={stillTakingMedication}
                  onSelect={setStillTakingMedication}
                />
                <YesNoButton
                  label="No"
                  value={false}
                  selectedValue={stillTakingMedication}
                  onSelect={setStillTakingMedication}
                />
              </View>
              {stillTakingMedication === false && (
                <View style={styles.warningBox}>
                  <Icon name="alert-triangle" size={16} color={COLORS.warning} />
                  <Text style={styles.warningText}>
                    Switch will be marked as failed if patient discontinued medication
                  </Text>
                </View>
              )}
            </View>

            {/* Patient Satisfaction */}
            <View style={styles.section}>
              <Text style={styles.questionLabel}>Patient satisfaction (optional)</Text>
              <View style={styles.satisfactionContainer}>
                {[1, 2, 3, 4, 5].map((rating) => (
                  <SatisfactionButton key={rating} rating={rating} />
                ))}
              </View>
            </View>

            {/* Notes */}
            <View style={styles.section}>
              <Text style={styles.questionLabel}>Additional notes (optional)</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Any additional observations or comments..."
                placeholderTextColor={COLORS.textTertiary}
                multiline
                numberOfLines={3}
                value={notes}
                onChangeText={setNotes}
              />
            </View>
          </ScrollView>

          {/* Submit Button */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.submitButton, !isFormValid() && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={!isFormValid() || isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color={COLORS.surface} />
              ) : (
                <>
                  <Icon name="check-circle" size={20} color={COLORS.surface} />
                  <Text style={styles.submitButtonText}>Complete Follow-up</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: '700',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.primary,
    marginTop: 2,
  },
  closeButton: {
    padding: SPACING.xs,
  },
  content: {
    padding: SPACING.lg,
  },
  patientCard: {
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  patientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  patientName: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  switchInfo: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  questionLabel: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  required: {
    color: COLORS.error,
  },
  yesNoContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  yesNoButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  yesNoButtonSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  yesNoText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  yesNoTextSelected: {
    color: COLORS.surface,
  },
  severityContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  severityButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  severityText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  textArea: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.text,
    backgroundColor: COLORS.surface,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.warningLight,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.sm,
  },
  warningText: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.warning,
  },
  satisfactionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.xs,
  },
  satisfactionButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    backgroundColor: COLORS.surface,
  },
  satisfactionButtonSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  satisfactionEmoji: {
    fontSize: 24,
    marginBottom: 2,
  },
  satisfactionRating: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  satisfactionRatingSelected: {
    color: COLORS.primary,
  },
  footer: {
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.disabled,
  },
  submitButtonText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: '600',
    color: COLORS.surface,
  },
});

export default FollowUpFormModal;
