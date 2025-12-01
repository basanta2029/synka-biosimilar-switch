import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
  Modal,
  FlatList,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Formik } from 'formik';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/Feather';
import { useCreatePatient, useUpdatePatient } from '../../hooks/usePatients';
import { Button, Input } from '../../components/common';
import { patientSchema } from '../../utils/validation';
import {
  COLORS,
  SPACING,
  TYPOGRAPHY,
  BORDER_RADIUS,
  DIAGNOSES,
  ALLERGIES,
  DIAGNOSIS_CATEGORIES,
} from '../../constants';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PatientFormData } from '../../types';

type Props = NativeStackScreenProps<any, 'PatientForm'>;

const PatientFormScreen: React.FC<Props> = ({ navigation, route }) => {
  const { t, i18n } = useTranslation();
  const { patientId } = route.params || {};
  const isEditing = !!patientId;

  const createPatient = useCreatePatient();
  const updatePatient = useUpdatePatient();

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showDiagnosisModal, setShowDiagnosisModal] = useState(false);
  const [showAllergyModal, setShowAllergyModal] = useState(false);

  const handleSubmit = async (values: PatientFormData) => {
    try {
      // Convert allergies array to comma-separated string
      const submitData = {
        ...values,
        allergies: values.allergies?.join(',') || '',
      };

      if (isEditing) {
        await updatePatient.mutateAsync({
          id: patientId,
          data: submitData,
        });
        Alert.alert(t('common.success'), t('patients.patientUpdated'), [
          {
            text: t('common.ok'),
            onPress: () => navigation.goBack(),
          },
        ]);
      } else {
        await createPatient.mutateAsync(submitData);
        Alert.alert(t('common.success'), t('patients.patientCreated'), [
          {
            text: t('common.ok'),
            onPress: () => navigation.goBack(),
          },
        ]);
      }
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message || t('patients.createError'));
    }
  };

  const initialValues: PatientFormData = {
    name: '',
    phone: '',
    dateOfBirth: new Date(new Date().getFullYear() - 18, 0, 1),
    language: i18n.language === 'es' ? 'ES' : 'EN',
    diagnosis: '',
    allergies: [],
  };

  const getDiagnosisLabel = (code: string) => {
    const diagnosis = DIAGNOSES.find(d => d.code === code);
    return diagnosis?.label || 'Select diagnosis';
  };

  const getAllergyLabels = (codes: string[]) => {
    if (!codes || codes.length === 0) return 'Select allergies';
    if (codes.includes('NKDA')) return 'No Known Drug Allergies';
    return codes.map(code => {
      const allergy = ALLERGIES.find(a => a.code === code);
      return allergy?.label || code;
    }).join(', ');
  };

  const DiagnosisModal = ({ visible, onClose, onSelect, selected }: any) => {
    const groupedDiagnoses = DIAGNOSIS_CATEGORIES.map(cat => ({
      ...cat,
      items: DIAGNOSES.filter(d => d.category === cat.code),
    })).filter(cat => cat.items.length > 0);

    return (
      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Diagnosis</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn}>
              <Icon name="x" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            {groupedDiagnoses.map(category => (
              <View key={category.code} style={styles.categorySection}>
                <Text style={styles.categoryTitle}>{category.label}</Text>
                {category.items.map(diagnosis => (
                  <TouchableOpacity
                    key={diagnosis.code}
                    style={[
                      styles.optionItem,
                      selected === diagnosis.code && styles.optionItemSelected,
                    ]}
                    onPress={() => {
                      onSelect(diagnosis.code);
                      onClose();
                    }}
                  >
                    <View style={styles.optionContent}>
                      <Text style={[
                        styles.optionText,
                        selected === diagnosis.code && styles.optionTextSelected,
                      ]}>
                        {diagnosis.label}
                      </Text>
                      {diagnosis.drugClasses.length > 0 && (
                        <Text style={styles.optionSubtext}>
                          Eligible for: {diagnosis.drugClasses.join(', ')}
                        </Text>
                      )}
                    </View>
                    {selected === diagnosis.code && (
                      <Icon name="check" size={20} color={COLORS.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </ScrollView>
        </View>
      </Modal>
    );
  };

  const AllergyModal = ({ visible, onClose, onSelect, selected }: any) => {
    const [localSelected, setLocalSelected] = useState<string[]>(selected || []);

    const toggleAllergy = (code: string) => {
      if (code === 'NKDA') {
        // If selecting NKDA, clear all others
        setLocalSelected(['NKDA']);
      } else {
        // Remove NKDA if selecting other allergies
        let newSelected = localSelected.filter(c => c !== 'NKDA');
        if (localSelected.includes(code)) {
          newSelected = newSelected.filter(c => c !== code);
        } else {
          newSelected = [...newSelected, code];
        }
        setLocalSelected(newSelected);
      }
    };

    const handleDone = () => {
      onSelect(localSelected);
      onClose();
    };

    const groupedAllergies = [
      { code: 'None', label: 'None', items: ALLERGIES.filter(a => a.category === 'None') },
      { code: 'Biologic Drug', label: 'Biologic Medications', items: ALLERGIES.filter(a => a.category === 'Biologic Drug') },
      { code: 'Material', label: 'Materials', items: ALLERGIES.filter(a => a.category === 'Material') },
      { code: 'Excipient', label: 'Excipients/Additives', items: ALLERGIES.filter(a => a.category === 'Excipient') },
      { code: 'Protein', label: 'Proteins', items: ALLERGIES.filter(a => a.category === 'Protein') },
      { code: 'Other', label: 'Other', items: ALLERGIES.filter(a => a.category === 'Other') },
    ].filter(cat => cat.items.length > 0);

    return (
      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Allergies</Text>
            <TouchableOpacity onPress={handleDone} style={styles.modalDoneBtn}>
              <Text style={styles.modalDoneText}>Done</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            {groupedAllergies.map(category => (
              <View key={category.code} style={styles.categorySection}>
                <Text style={styles.categoryTitle}>{category.label}</Text>
                {category.items.map(allergy => (
                  <TouchableOpacity
                    key={allergy.code}
                    style={[
                      styles.optionItem,
                      localSelected.includes(allergy.code) && styles.optionItemSelected,
                    ]}
                    onPress={() => toggleAllergy(allergy.code)}
                  >
                    <View style={styles.optionContent}>
                      <Text style={[
                        styles.optionText,
                        localSelected.includes(allergy.code) && styles.optionTextSelected,
                      ]}>
                        {allergy.label}
                      </Text>
                      {allergy.relatedDrugs.length > 0 && (
                        <Text style={styles.optionSubtext}>
                          Affects: {allergy.relatedDrugs.slice(0, 3).join(', ')}
                          {allergy.relatedDrugs.length > 3 && '...'}
                        </Text>
                      )}
                    </View>
                    <View style={[
                      styles.checkbox,
                      localSelected.includes(allergy.code) && styles.checkboxSelected,
                    ]}>
                      {localSelected.includes(allergy.code) && (
                        <Icon name="check" size={14} color={COLORS.surface} />
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </ScrollView>
        </View>
      </Modal>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Icon name={isEditing ? 'edit-3' : 'user-plus'} size={24} color={COLORS.primary} />
          </View>
          <Text style={styles.title}>
            {isEditing ? t('patients.editPatient') : t('patients.newPatient')}
          </Text>
          <Text style={styles.subtitle}>
            {isEditing
              ? t('patients.updatePatientInfo')
              : t('patients.registerPatient')}
          </Text>
        </View>

        <Formik
          initialValues={initialValues}
          validationSchema={patientSchema}
          onSubmit={handleSubmit}
        >
          {({
            handleChange,
            handleBlur,
            handleSubmit,
            setFieldValue,
            values,
            errors,
            touched,
          }) => (
            <View style={styles.form}>
              {/* Basic Information Section */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Icon name="user" size={18} color={COLORS.primary} />
                  <Text style={styles.sectionTitle}>Basic Information</Text>
                </View>

                <Input
                  label={`${t('patients.name')} *`}
                  placeholder={t('patients.namePlaceholder')}
                  value={values.name}
                  onChangeText={handleChange('name')}
                  onBlur={handleBlur('name')}
                  error={touched.name && errors.name ? errors.name : undefined}
                  autoCapitalize="words"
                  editable={!createPatient.isPending && !updatePatient.isPending}
                />

                <Input
                  label={`${t('patients.phone')} *`}
                  placeholder={t('patients.phonePlaceholder')}
                  value={values.phone}
                  onChangeText={handleChange('phone')}
                  onBlur={handleBlur('phone')}
                  error={touched.phone && errors.phone ? errors.phone : undefined}
                  keyboardType="phone-pad"
                  editable={!createPatient.isPending && !updatePatient.isPending}
                />

                <View style={styles.fieldContainer}>
                  <Text style={styles.label}>{t('patients.dateOfBirth')} *</Text>
                  <TouchableOpacity
                    style={styles.selectButton}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Icon name="calendar" size={18} color={COLORS.textSecondary} />
                    <Text style={styles.selectButtonText}>
                      {values.dateOfBirth.toLocaleDateString()}
                    </Text>
                    <Icon name="chevron-down" size={18} color={COLORS.textSecondary} />
                  </TouchableOpacity>
                  {touched.dateOfBirth && errors.dateOfBirth && (
                    <Text style={styles.errorText}>{errors.dateOfBirth as string}</Text>
                  )}
                  <Text style={styles.helperText}>
                    {t('patients.ageRequirement')}
                  </Text>

                  {showDatePicker && (
                    <DateTimePicker
                      value={values.dateOfBirth}
                      mode="date"
                      display="default"
                      maximumDate={new Date()}
                      onChange={(event, selectedDate) => {
                        setShowDatePicker(false);
                        if (selectedDate) {
                          setFieldValue('dateOfBirth', selectedDate);
                        }
                      }}
                    />
                  )}
                </View>
              </View>

              {/* Clinical Information Section */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Icon name="activity" size={18} color={COLORS.primary} />
                  <Text style={styles.sectionTitle}>Clinical Information</Text>
                </View>

                <View style={styles.fieldContainer}>
                  <Text style={styles.label}>Primary Diagnosis</Text>
                  <TouchableOpacity
                    style={styles.selectButton}
                    onPress={() => setShowDiagnosisModal(true)}
                  >
                    <Icon name="clipboard" size={18} color={COLORS.textSecondary} />
                    <Text style={[
                      styles.selectButtonText,
                      !values.diagnosis && styles.placeholderText
                    ]}>
                      {getDiagnosisLabel(values.diagnosis || '')}
                    </Text>
                    <Icon name="chevron-down" size={18} color={COLORS.textSecondary} />
                  </TouchableOpacity>
                  <Text style={styles.helperText}>
                    Used to verify biosimilar eligibility
                  </Text>
                </View>

                <View style={styles.fieldContainer}>
                  <Text style={styles.label}>Allergies</Text>
                  <TouchableOpacity
                    style={styles.selectButton}
                    onPress={() => setShowAllergyModal(true)}
                  >
                    <Icon name="alert-triangle" size={18} color={COLORS.textSecondary} />
                    <Text style={[
                      styles.selectButtonText,
                      (!values.allergies || values.allergies.length === 0) && styles.placeholderText,
                      values.allergies?.includes('NKDA') && styles.nkdaText,
                    ]} numberOfLines={1}>
                      {getAllergyLabels(values.allergies || [])}
                    </Text>
                    <Icon name="chevron-down" size={18} color={COLORS.textSecondary} />
                  </TouchableOpacity>
                  <Text style={styles.helperText}>
                    Drug and formulation allergies
                  </Text>
                </View>

                {/* Selected Allergies Tags */}
                {values.allergies && values.allergies.length > 0 && !values.allergies.includes('NKDA') && (
                  <View style={styles.tagContainer}>
                    {values.allergies.map(code => {
                      const allergy = ALLERGIES.find(a => a.code === code);
                      return (
                        <View key={code} style={styles.tag}>
                          <Text style={styles.tagText}>{allergy?.label || code}</Text>
                          <TouchableOpacity
                            onPress={() => {
                              setFieldValue('allergies', values.allergies?.filter(c => c !== code));
                            }}
                          >
                            <Icon name="x" size={14} color={COLORS.error} />
                          </TouchableOpacity>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>

              {/* Action Buttons */}
              <View style={styles.buttonContainer}>
                <Button
                  title={t('common.cancel')}
                  onPress={() => navigation.goBack()}
                  variant="outline"
                  disabled={createPatient.isPending || updatePatient.isPending}
                  style={styles.cancelButton}
                />

                <Button
                  title={isEditing ? t('patients.updatePatient') : t('patients.createPatient')}
                  onPress={handleSubmit as any}
                  loading={createPatient.isPending || updatePatient.isPending}
                  disabled={createPatient.isPending || updatePatient.isPending}
                  style={styles.submitButton}
                />
              </View>

              {/* Modals */}
              <DiagnosisModal
                visible={showDiagnosisModal}
                onClose={() => setShowDiagnosisModal(false)}
                onSelect={(code: string) => setFieldValue('diagnosis', code)}
                selected={values.diagnosis}
              />

              <AllergyModal
                visible={showAllergyModal}
                onClose={() => setShowAllergyModal(false)}
                onSelect={(codes: string[]) => setFieldValue('allergies', codes)}
                selected={values.allergies}
              />
            </View>
          )}
        </Formik>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primaryLight + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.xxl,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
  },
  form: {
    width: '100%',
  },
  section: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: '600',
    color: COLORS.text,
    marginLeft: SPACING.sm,
  },
  fieldContainer: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.surface,
    gap: SPACING.sm,
  },
  selectButtonText: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.text,
  },
  placeholderText: {
    color: COLORS.textTertiary,
  },
  nkdaText: {
    color: COLORS.success,
    fontWeight: '500',
  },
  helperText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textTertiary,
    marginTop: SPACING.xs,
  },
  errorText: {
    color: COLORS.error,
    fontSize: TYPOGRAPHY.fontSize.xs,
    marginTop: SPACING.xs,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginTop: SPACING.sm,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.errorLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    gap: SPACING.xs,
  },
  tagText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.error,
    fontWeight: '500',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.lg,
  },
  cancelButton: {
    flex: 1,
  },
  submitButton: {
    flex: 2,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    backgroundColor: COLORS.surface,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  modalCloseBtn: {
    padding: SPACING.xs,
  },
  modalDoneBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  modalDoneText: {
    color: COLORS.surface,
    fontWeight: '600',
    fontSize: TYPOGRAPHY.fontSize.sm,
  },
  modalContent: {
    flex: 1,
    padding: SPACING.md,
  },
  categorySection: {
    marginBottom: SPACING.lg,
  },
  categoryTitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.xs,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  optionItemSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '08',
  },
  optionContent: {
    flex: 1,
  },
  optionText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.text,
  },
  optionTextSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  optionSubtext: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textTertiary,
    marginTop: 2,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
});

export default PatientFormScreen;
