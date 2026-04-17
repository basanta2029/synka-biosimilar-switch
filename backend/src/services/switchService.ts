import crypto from 'crypto';
import { PrismaClient, SwitchStatus, AppointmentType, AppointmentStatus } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { drugService } from './drugService';
import { smsService } from './smsService';
import {
  switchInitiatedMessage,
  appointmentReminderMessage,
  switchCompletedMessage,
} from './smsTemplates';

export interface EligibilityResult {
  eligible: boolean;
  reasons: string[];
  /**
   * Free-text clinical/contextual notes and warnings for clinician awareness.
   * Not strictly eligibility blockers.
   */
  warnings: string[];
  /**
   * Snapshots returned to the client so the mobile app does not need
   * to make extra calls after eligibility.
   */
  patientSnapshot: any;
  drugSnapshot: any;
  currentDrug: any;
  recommendedBiosimilars: any[];
}

export interface CreateSwitchRequest {
  patientId: string;
  fromDrugId: string;
  toDrugId: string;
  eligibilityNotes?: string;
  patientAccessToken?: string;
}

export interface ConsentRequest {
  switchId: string;
  consentText: string;
  consentObtained: boolean;
}

export interface FollowUpData {
  hasSideEffects: boolean;
  sideEffectSeverity?: 'MILD' | 'MODERATE' | 'SEVERE';
  sideEffectDescription?: string;
  stillTakingMedication: boolean;
  patientSatisfaction?: number;
  notes?: string;
}

// Mapping of diagnoses to their compatible drug therapeutic classes
// This enables the eligibility engine to verify diagnosis-drug compatibility
const DIAGNOSIS_DRUG_CLASS_MAP: Record<string, string[]> = {
  'RHEUMATOID_ARTHRITIS': ['TNF-Blocker', 'IL-6 Inhibitor', 'JAK Inhibitor'],
  'CROHNS_DISEASE': ['TNF-Blocker', 'IL-12/23 Inhibitor'],
  'ULCERATIVE_COLITIS': ['TNF-Blocker', 'IL-12/23 Inhibitor'],
  'PSORIASIS': ['TNF-Blocker', 'IL-17 Inhibitor', 'IL-23 Inhibitor'],
  'PSORIATIC_ARTHRITIS': ['TNF-Blocker', 'IL-17 Inhibitor'],
  'ANKYLOSING_SPONDYLITIS': ['TNF-Blocker', 'IL-17 Inhibitor'],
  'HER2_BREAST_CANCER': ['HER2-Blocker'],
  'HER2_GASTRIC_CANCER': ['HER2-Blocker'],
  'NON_HODGKIN_LYMPHOMA': ['Anti-CD20'],
  'CLL': ['Anti-CD20'],
  'MULTIPLE_SCLEROSIS': ['Anti-CD20', 'Interferon Beta'],
  'CKD_ANEMIA': ['Erythropoietin'],
  'CHEMOTHERAPY_ANEMIA': ['Erythropoietin'],
  'NEUTROPENIA': ['G-CSF'],
  'CHEMOTHERAPY_NEUTROPENIA': ['G-CSF'],
  'DIABETIC_MACULAR_EDEMA': ['Anti-VEGF'],
  'AGE_RELATED_MACULAR_DEGENERATION': ['Anti-VEGF'],
};

// Allergy codes mapped to their related drug names/ingredients
const ALLERGY_DRUG_RELATIONSHIPS: Record<string, string[]> = {
  'ADALIMUMAB': ['humira', 'amjevita', 'hadlima', 'hyrimoz', 'cyltezo', 'yuflyma', 'adalimumab'],
  'INFLIXIMAB': ['remicade', 'inflectra', 'renflexis', 'avsola', 'infliximab'],
  'ETANERCEPT': ['enbrel', 'erelzi', 'eticovo', 'etanercept'],
  'RITUXIMAB': ['rituxan', 'truxima', 'ruxience', 'riabni', 'rituximab'],
  'TRASTUZUMAB': ['herceptin', 'ogivri', 'herzuma', 'ontruzant', 'kanjinti', 'trazimera', 'trastuzumab'],
  'BEVACIZUMAB': ['avastin', 'mvasi', 'zirabev', 'bevacizumab'],
  'PEGFILGRASTIM': ['neulasta', 'fulphila', 'udenyca', 'ziextenzo', 'nyvepria', 'pegfilgrastim'],
  'FILGRASTIM': ['neupogen', 'zarxio', 'nivestym', 'granix', 'releuko', 'filgrastim'],
  'EPOETIN': ['eprex', 'binocrit', 'epoetin'],
  'RANIBIZUMAB': ['lucentis', 'bioucenta', 'ranibizumab'],
  'MOUSE_PROTEIN': ['rituximab', 'infliximab', 'trastuzumab', 'bevacizumab'],
  'MURINE_PROTEINS': ['rituximab', 'infliximab', 'trastuzumab', 'bevacizumab'],
  'HAMSTER_PROTEIN': ['adalimumab', 'etanercept'],
  'ECOLI_PROTEINS': ['filgrastim', 'pegfilgrastim', 'insulin'],
  'ECOLI_PROTEIN': ['filgrastim', 'pegfilgrastim', 'insulin'],
  'POLYSORBATE': ['adalimumab', 'infliximab', 'rituximab', 'trastuzumab'],
  'LATEX': [], // Latex allergy doesn't affect drug eligibility, but is noted for injection devices
  'NKDA': [], // No Known Drug Allergies
};

// Deterministic Ghana prototype mapping: diagnosis -> allowed active ingredients
const GHANA_DIAGNOSIS_ALLOWED_INGREDIENTS: Record<string, string[]> = {
  RHEUMATOID_ARTHRITIS: ['adalimumab', 'etanercept', 'infliximab', 'rituximab'],
  CROHNS_DISEASE: ['adalimumab', 'infliximab'],
  ULCERATIVE_COLITIS: ['adalimumab', 'infliximab'],
  PSORIASIS: ['adalimumab', 'etanercept', 'infliximab'],
  PSORIATIC_ARTHRITIS: ['adalimumab', 'etanercept', 'infliximab'],
  ANKYLOSING_SPONDYLITIS: ['adalimumab', 'etanercept', 'infliximab'],
  HER2_BREAST_CANCER: ['trastuzumab'],
  HER2_GASTRIC_CANCER: ['trastuzumab'],
  NON_HODGKIN_LYMPHOMA: ['rituximab'],
  CLL: ['rituximab'],
  MULTIPLE_SCLEROSIS: ['rituximab'],
  NEUTROPENIA: ['filgrastim'],
  CHEMOTHERAPY_NEUTROPENIA: ['filgrastim'],
  CKD_ANEMIA: ['epoetin'],
  CHEMOTHERAPY_ANEMIA: ['epoetin'],
  DIABETIC_MACULAR_EDEMA: ['ranibizumab'],
  AGE_RELATED_MACULAR_DEGENERATION: ['ranibizumab'],
};

export class SwitchService {
  private normalizeIngredient(value?: string): string {
    if (!value) return '';
    const lower = value.toLowerCase();
    // Keep base molecule for strings like "trastuzumab-dkst"
    return lower.split('-')[0].trim();
  }

  private hasDrugAllergyContraindication(
    allergyCodes: string[],
    drugName: string,
    activeIngredient?: string
  ): { blocked: boolean; matchedAllergies: string[] } {
    const drugNameLower = drugName.toLowerCase();
    const ingredientLower = this.normalizeIngredient(activeIngredient);
    const matchedAllergies: string[] = [];

    for (const allergyCode of allergyCodes) {
      const relatedDrugs = ALLERGY_DRUG_RELATIONSHIPS[allergyCode] || [];
      const isContraindicated = relatedDrugs.some((drug: string) =>
        drugNameLower.includes(drug.toLowerCase()) ||
        ingredientLower.includes(drug.toLowerCase()) ||
        drug.toLowerCase().includes(drugNameLower) ||
        drug.toLowerCase().includes(ingredientLower)
      );

      if (isContraindicated) {
        matchedAllergies.push(allergyCode);
      }
    }

    return { blocked: matchedAllergies.length > 0, matchedAllergies };
  }

  /**
   * Check patient eligibility for biosimilar switch
   * This is the Eligibility Engine
   *
   * Checks performed:
   * 1. Pending switch check
   * 2. Biosimilar availability check
   * 3. Diagnosis-drug compatibility check
   * 4. Allergy-drug contraindication check
   * 5. Interchangeability status
   * 6. Cost savings calculation
   */
  async checkEligibility(patientId: string, currentDrugId: string): Promise<EligibilityResult> {
    // Get patient with diagnosis, allergy, and recent switch information
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        switches: true,
      },
    });

    if (!patient) {
      throw new Error('Patient not found');
    }

    // PRD core rule: Age >= 18
    const today = new Date();
    const ageYears =
      today.getFullYear() - patient.dateOfBirth.getFullYear() -
      (today < new Date(today.getFullYear(), patient.dateOfBirth.getMonth(), patient.dateOfBirth.getDate()) ? 1 : 0);

    const reasons: string[] = [];
    const warnings: string[] = [];
    let eligible = true;

    if (ageYears < 18) {
      eligible = false;
      reasons.push('UNDER_18: Patient must be at least 18 years old for biosimilar switch');
    }

    // Get current drug
    const currentDrug = await prisma.drug.findUnique({
      where: { id: currentDrugId },
    });

    if (!currentDrug) {
      throw new Error('Drug not found');
    }

    // PRD rule: current drug must be a brand biologic, not already a biosimilar
    if (currentDrug.type !== 'BRAND') {
      return {
        eligible: false,
        reasons: ['ALREADY_BIOSIMILAR: Current medication is already a biosimilar; switch is not applicable'],
        warnings,
        patientSnapshot: {
          id: patient.id,
          name: patient.name,
          dateOfBirth: patient.dateOfBirth,
          language: patient.language,
          allergies: patient.allergies,
        },
        drugSnapshot: currentDrug,
        currentDrug,
        recommendedBiosimilars: [],
      };
    }

    // Get current drug and its biosimilar alternatives (also computes savings)
    const alternatives = await drugService.getBiosimilarAlternatives(currentDrugId);
    const { brandDrug, biosimilars } = alternatives;

    // Check if patient has pending switches
    const pendingSwitches = patient.switches.filter((s: any) => s.status === 'PENDING');
    if (pendingSwitches.length > 0) {
      eligible = false;
      reasons.push('PENDING_SWITCH: Patient has a pending switch that must be completed or cancelled first');
    }

    // Check for recently completed switches (90-day monitoring cooldown)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const recentCompleted = patient.switches.filter(
      (s: any) => s.status === 'COMPLETED' && new Date(s.switchDate) > ninetyDaysAgo
    );
    if (recentCompleted.length > 0) {
      const lastSwitch = recentCompleted.sort(
        (a: any, b: any) => new Date(b.switchDate).getTime() - new Date(a.switchDate).getTime()
      )[0];
      const daysSince = Math.floor(
        (today.getTime() - new Date(lastSwitch.switchDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      warnings.push(
        `RECENT_SWITCH: A biosimilar switch was completed ${daysSince} day(s) ago. ` +
        `A 90-day post-switch monitoring period is recommended before initiating another switch.`
      );
    }

    // Clinical stability reminder — no treatment history data available, so always warn
    warnings.push(
      'STABILITY_CHECK: Reminder — verify the patient has been clinically stable on the current biologic ' +
      'for at least 3 months before switching (Ghana FDA biosimilar guidance).'
    );

    // Check if there are available biosimilars
    if (biosimilars.length === 0) {
      eligible = false;
      reasons.push('NO_BIOSIMILARS: No approved biosimilar alternatives available for this medication');
    }

    // Check diagnosis-drug compatibility
    if (patient.diagnosis && patient.diagnosis !== 'OTHER') {
      const compatibleClasses = DIAGNOSIS_DRUG_CLASS_MAP[patient.diagnosis] || [];
      const drugClass = brandDrug.therapeuticClass;

      if (compatibleClasses.length > 0 && drugClass) {
        const isCompatible = compatibleClasses.some(
          (c: string) =>
            drugClass.toLowerCase().includes(c.toLowerCase()) ||
            c.toLowerCase().includes(drugClass.toLowerCase())
        );

        if (isCompatible) {
          warnings.push(
            `DIAGNOSIS_MATCH: ${this.formatDiagnosis(
              patient.diagnosis
            )} is commonly treated with ${drugClass} medications`
          );
        } else {
          eligible = false;
          reasons.push(
            `DIAGNOSIS_MISMATCH: Patient's diagnosis (${this.formatDiagnosis(
              patient.diagnosis
            )}) does not match ${drugClass} therapy. This drug class is not indicated for the recorded diagnosis.`
          );
        }
      }
    } else if (patient.diagnosis === 'OTHER') {
      warnings.push(
        'UNSPECIFIED_DIAGNOSIS: Diagnosis is "Other". Eligibility cannot be fully verified — prescriber must confirm indication.'
      );
    } else {
      warnings.push(
        'NO_DIAGNOSIS_ON_FILE: No diagnosis on file. Consider updating patient record for more accurate eligibility assessment.'
      );
    }

    // Check for allergies — brand-level match is a warning (patient is already on it),
    // biosimilar-level filtering below is the real safety gate.
    let patientAllergyCodes: string[] = [];
    if (patient.allergies) {
      patientAllergyCodes = patient.allergies.split(',').map((a: string) => a.trim().toUpperCase());
      const hasNKDA = patientAllergyCodes.includes('NKDA');

      if (!hasNKDA) {
        const allergyCheck = this.hasDrugAllergyContraindication(
          patientAllergyCodes,
          brandDrug.name,
          brandDrug.activeIngredient || ''
        );

        if (allergyCheck.blocked) {
          warnings.push(
            `ALLERGY_VS_CURRENT: Patient has documented allergy (${allergyCheck.matchedAllergies.join(
              ', '
            )}) related to their current medication (${brandDrug.name}). ` +
            `Since the patient is already on this drug, verify allergy record accuracy. ` +
            `Biosimilar candidates with matching allergens will be excluded below.`
          );
        }

        const allergyList = patientAllergyCodes.filter((a: string) => a !== 'NKDA').join(', ');
        if (allergyList && !allergyCheck.blocked) {
          warnings.push(
            `DOCUMENTED_ALLERGIES: ${allergyList}. Biosimilar candidates will be screened against these.`
          );
        }

        if (patientAllergyCodes.includes('OTHER')) {
          warnings.push(
            'UNSPECIFIED_ALLERGY: Patient has an unspecified allergy marked as "Other". ' +
            'Prescriber must verify manually that no contraindications exist with the target biosimilar.'
          );
        }
      }
    }

    // Deterministic Ghana diagnosis gating for recommendation list
    let filteredBiosimilars = biosimilars;
    if (patient.diagnosis && patient.diagnosis !== 'OTHER') {
      const allowedIngredients = GHANA_DIAGNOSIS_ALLOWED_INGREDIENTS[patient.diagnosis];
      if (allowedIngredients && allowedIngredients.length > 0) {
        filteredBiosimilars = filteredBiosimilars.filter((biosimilar: any) => {
          const ingredient = this.normalizeIngredient(biosimilar.activeIngredient || '');
          return allowedIngredients.some((allowed) => ingredient.includes(allowed));
        });
        warnings.push(
          `GHANA_DIAGNOSIS_RULE: ${this.formatDiagnosis(patient.diagnosis)} allows molecules: ${allowedIngredients.join(
            ', '
          )}.`
        );
      }
    } else {
      // No diagnosis or OTHER: restrict to same-molecule biosimilars only
      const brandIngredient = this.normalizeIngredient(brandDrug.activeIngredient || '');
      filteredBiosimilars = filteredBiosimilars.filter((biosimilar: any) => {
        const ingredient = this.normalizeIngredient(biosimilar.activeIngredient || '');
        return ingredient === brandIngredient;
      });
      warnings.push(
        'SAME_MOLECULE_ONLY: No specific diagnosis on file — restricted to same-molecule biosimilars for safety.'
      );
    }

    // Remove biosimilars blocked by patient allergy history
    const hasNKDA = patientAllergyCodes.includes('NKDA');
    if (patientAllergyCodes.length > 0 && !hasNKDA) {
      const allergySafeBiosimilars: any[] = [];
      const excludedByAllergy: string[] = [];

      for (const biosimilar of filteredBiosimilars) {
        const allergyCheck = this.hasDrugAllergyContraindication(
          patientAllergyCodes,
          biosimilar.name,
          biosimilar.activeIngredient || ''
        );
        if (allergyCheck.blocked) {
          excludedByAllergy.push(`${biosimilar.name} [${allergyCheck.matchedAllergies.join(', ')}]`);
          continue;
        }
        allergySafeBiosimilars.push(biosimilar);
      }

      filteredBiosimilars = allergySafeBiosimilars;
      if (excludedByAllergy.length > 0) {
        warnings.push(
          `ALLERGY_FILTER: Excluded ${excludedByAllergy.length} candidate(s): ${excludedByAllergy.join('; ')}`
        );
      }
    }

    if (filteredBiosimilars.length === 0) {
      eligible = false;
      reasons.push(
        'NO_GHANA_MATCH: No biosimilar remained after Ghana diagnosis/allergy safety filters.'
      );
    }

    // Check for biosimilars designated interchangeable by a reference NRA
    const interchangeableBiosimilars = filteredBiosimilars.filter(
      (b: any) => b.interchangeability === 'INTERCHANGEABLE'
    );

    if (interchangeableBiosimilars.length > 0) {
      warnings.push(
        `${interchangeableBiosimilars.length} biosimilar option(s) have strong interchangeability data from at least one strict regulator; ` +
          `under Ghana FDA guidelines, switching still requires a prescriber decision and is not automatic at the pharmacy level.`
      );
    }

    // Add cost savings info
    if (filteredBiosimilars.length > 0) {
      const bestSavings = filteredBiosimilars[0]; // Already sorted by savings
      warnings.push(
        `COST_SAVINGS: Potential savings up to GHS ${bestSavings.annualSavings.toLocaleString()}/year ` +
          `(${bestSavings.savingsPercent}% reduction, estimated based on clinic pricing).`
      );
    }

    // NHIS coverage/prototype validation warnings for safe messaging
    const nhisMatchedCount = filteredBiosimilars.filter((b: any) => b.nhisCoverage?.isListed).length;
    if (filteredBiosimilars.length > 0) {
      warnings.push(
        `NHIS_CHECK: ${nhisMatchedCount}/${filteredBiosimilars.length} biosimilar option(s) matched NHIS 2025 pricing entries. ` +
          `Use matched pricing only; keep unmatched products as prototype/unverified.`
      );
    }

    return {
      eligible,
      reasons,
      warnings,
      patientSnapshot: {
        id: patient.id,
        name: patient.name,
        dateOfBirth: patient.dateOfBirth,
        language: patient.language,
        allergies: patient.allergies,
      },
      drugSnapshot: brandDrug,
      currentDrug: brandDrug,
      recommendedBiosimilars: filteredBiosimilars,
    };
  }

  /**
   * Format diagnosis code to human-readable label
   */
  private formatDiagnosis(code: string): string {
    return code
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Re-evaluate PENDING switches for a patient after eligibility-affecting
   * fields (DOB, diagnosis, allergies) are updated.  Any switch that is no
   * longer eligible is automatically cancelled with an explanatory note.
   */
  async cancelStaleSwitch(
    patientId: string,
    changedFields: Record<string, any>
  ): Promise<void> {
    const pending = await prisma.switchRecord.findMany({
      where: { patientId, status: 'PENDING' },
    });

    for (const sw of pending) {
      try {
        const result = await this.checkEligibility(patientId, sw.fromDrugId);
        if (!result.eligible) {
          await this.cancelSwitch(
            sw.id,
            `Auto-cancelled: patient update (${Object.keys(changedFields).join(', ')}) made this switch ineligible — ${result.reasons.join('; ')}`
          );
        }
      } catch (err: any) {
        console.error(`cancelStaleSwitch: could not re-evaluate switch ${sw.id}:`, err.message);
      }
    }
  }

  /**
   * Create a new switch record
   */
  async createSwitch(data: CreateSwitchRequest) {
    const { patientId, fromDrugId, toDrugId, eligibilityNotes, patientAccessToken: providedToken } = data;

    // Verify patient exists
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      throw new Error('Patient not found');
    }

    // Verify drugs exist
    const fromDrug = await prisma.drug.findUnique({ where: { id: fromDrugId } });
    const toDrug = await prisma.drug.findUnique({ where: { id: toDrugId } });

    if (!fromDrug || !toDrug) {
      throw new Error('One or both drugs not found');
    }

    // Verify toDrug is a biosimilar
    if (toDrug.type !== 'BIOSIMILAR') {
      throw new Error('Target drug must be a biosimilar');
    }

    // Create switch record with a unique patient-facing access token
    const patientAccessToken = providedToken || crypto.randomUUID();
    const switchRecord = await prisma.switchRecord.create({
      data: {
        patientId,
        fromDrugId,
        toDrugId,
        switchDate: new Date(),
        status: 'PENDING',
        eligibilityNotes,
        consentObtained: false,
        patientAccessToken,
      },
      include: {
        patient: true,
        fromDrug: true,
        toDrug: true,
      },
    });

    return switchRecord;
  }

  /**
   * Record patient consent for the switch
   */
  async recordConsent(data: ConsentRequest) {
    const { switchId, consentText, consentObtained } = data;

    const switchRecord = await prisma.switchRecord.findUnique({
      where: { id: switchId },
      include: { patient: true },
    });

    if (!switchRecord) {
      throw new Error('Switch record not found');
    }

    if (switchRecord.status !== 'PENDING') {
      throw new Error('Can only record consent for pending switches');
    }

    // Update switch with consent
    await prisma.switchRecord.update({
      where: { id: switchId },
      data: {
        consentObtained,
        consentTimestamp: consentObtained ? new Date() : null,
        consentText: consentObtained ? consentText : null,
      },
    });

    // If consent obtained, schedule follow-up appointments and send SMS
    if (consentObtained) {
      await this.scheduleFollowUpAppointments(switchId, switchRecord.patientId);

      // Send switch-initiated SMS to patient
      try {
        const fromDrug = await prisma.drug.findUnique({ where: { id: switchRecord.fromDrugId } });
        const toDrug = await prisma.drug.findUnique({ where: { id: switchRecord.toDrugId } });
        const patient = switchRecord.patient;

        if (fromDrug && toDrug && patient) {
          const day3Date = new Date();
          day3Date.setDate(day3Date.getDate() + 3);

          const message = switchInitiatedMessage(
            patient.language as 'EN' | 'TW',
            {
              patientName: patient.name.split(' ')[0], // first name for brevity
              fromDrug: fromDrug.name,
              toDrug: toDrug.name,
              day3Date: day3Date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
            }
          );

          await smsService.sendSmsNow({
            patientId: patient.id,
            to: patient.phone,
            body: message,
            language: patient.language as 'EN' | 'TW',
          });
        }
      } catch (smsErr: any) {
        // SMS failure should not block the consent flow
        console.error('[SMS] Failed to send switch-initiated SMS:', smsErr?.message);
      }
    }

    // Re-fetch with all relations so the response includes appointments
    const updatedSwitch = await prisma.switchRecord.findUniqueOrThrow({
      where: { id: switchId },
      include: {
        patient: true,
        fromDrug: true,
        toDrug: true,
        appointments: true,
      },
    });

    return updatedSwitch;
  }

  /**
   * Schedule Day-3 and Day-14 follow-up appointments
   */
  async scheduleFollowUpAppointments(switchId: string, patientId: string) {
    const now = new Date();

    // Day-3 follow-up
    const day3Date = new Date(now);
    day3Date.setDate(day3Date.getDate() + 3);
    day3Date.setHours(9, 0, 0, 0); // 9 AM

    // Day-14 follow-up
    const day14Date = new Date(now);
    day14Date.setDate(day14Date.getDate() + 14);
    day14Date.setHours(9, 0, 0, 0); // 9 AM

    const appointments = await prisma.appointment.createMany({
      data: [
        {
          patientId,
          switchId,
          appointmentType: 'DAY_3',
          scheduledAt: day3Date,
          status: 'SCHEDULED',
          notes: 'Initial follow-up to check for side effects and medication adherence',
        },
        {
          patientId,
          switchId,
          appointmentType: 'DAY_14',
          scheduledAt: day14Date,
          status: 'SCHEDULED',
          notes: 'Two-week follow-up to assess treatment efficacy and patient satisfaction',
        },
      ],
    });

    // Schedule reminder SMS 24 hours before each appointment
    try {
      const patient = await prisma.patient.findUnique({ where: { id: patientId } });
      if (patient) {
        const lang = patient.language as 'EN' | 'TW';
        const firstName = patient.name.split(' ')[0];

        // Day-3 reminder (sent 24h before)
        const day3Reminder = new Date(day3Date);
        day3Reminder.setDate(day3Reminder.getDate() - 1);
        day3Reminder.setHours(10, 0, 0, 0); // 10 AM day before

        await smsService.scheduleSms({
          patientId,
          to: patient.phone,
          body: appointmentReminderMessage(lang, {
            patientName: firstName,
            appointmentType: 'DAY_3',
            date: day3Date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
          }),
          language: lang,
          scheduledFor: day3Reminder.toISOString(),
        });

        // Day-14 reminder (sent 24h before)
        const day14Reminder = new Date(day14Date);
        day14Reminder.setDate(day14Reminder.getDate() - 1);
        day14Reminder.setHours(10, 0, 0, 0); // 10 AM day before

        await smsService.scheduleSms({
          patientId,
          to: patient.phone,
          body: appointmentReminderMessage(lang, {
            patientName: firstName,
            appointmentType: 'DAY_14',
            date: day14Date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
          }),
          language: lang,
          scheduledFor: day14Reminder.toISOString(),
        });
      }
    } catch (smsErr: any) {
      // SMS scheduling failure should not block appointment creation
      console.error('[SMS] Failed to schedule reminder SMS:', smsErr?.message);
    }

    return appointments;
  }

  /**
   * Complete switch after successful follow-ups
   */
  async completeSwitch(switchId: string) {
    const switchRecord = await prisma.switchRecord.findUnique({
      where: { id: switchId },
      include: {
        appointments: {
          include: { followUp: true },
        },
      },
    });

    if (!switchRecord) {
      throw new Error('Switch record not found');
    }

    if (!switchRecord.consentObtained) {
      throw new Error('Cannot complete switch without patient consent');
    }

    // Update switch status
    const updatedSwitch = await prisma.switchRecord.update({
      where: { id: switchId },
      data: {
        status: 'COMPLETED',
        completionDate: new Date(),
      },
      include: {
        patient: true,
        fromDrug: true,
        toDrug: true,
        appointments: true,
      },
    });

    // Send switch-completed SMS to patient
    this.sendSwitchCompletedSms(updatedSwitch).catch((err: any) =>
      console.error('[SMS] Failed to send switch-completed SMS:', err?.message)
    );

    return updatedSwitch;
  }

  /**
   * Send completion SMS (fire-and-forget helper)
   */
  private async sendSwitchCompletedSms(switchRecord: any): Promise<void> {
    const patient = switchRecord.patient;
    const toDrug = switchRecord.toDrug;
    if (!patient || !toDrug) return;

    const message = switchCompletedMessage(
      patient.language as 'EN' | 'TW',
      {
        patientName: patient.name.split(' ')[0],
        toDrug: toDrug.name,
      }
    );

    await smsService.sendSmsNow({
      patientId: patient.id,
      to: patient.phone,
      body: message,
      language: patient.language as 'EN' | 'TW',
    });
  }

  /**
   * Cancel a switch
   */
  async cancelSwitch(switchId: string, reason?: string) {
    const switchRecord = await prisma.switchRecord.findUnique({
      where: { id: switchId },
    });

    if (!switchRecord) {
      throw new Error('Switch record not found');
    }

    if (switchRecord.status === 'COMPLETED') {
      throw new Error('Cannot cancel a completed switch');
    }

    // Update switch status
    const updatedSwitch = await prisma.switchRecord.update({
      where: { id: switchId },
      data: {
        status: 'CANCELLED',
        eligibilityNotes: reason
          ? `${switchRecord.eligibilityNotes || ''}\nCancellation reason: ${reason}`.trim()
          : switchRecord.eligibilityNotes,
      },
      include: {
        patient: true,
        fromDrug: true,
        toDrug: true,
      },
    });

    // Cancel any scheduled appointments
    await prisma.appointment.updateMany({
      where: {
        switchId,
        status: 'SCHEDULED',
      },
      data: {
        status: 'MISSED',
        notes: 'Cancelled due to switch cancellation',
      },
    });

    return updatedSwitch;
  }

  /**
   * Get all switches with optional filtering
   */
  async getSwitches(filters?: { status?: SwitchStatus; patientId?: string }) {
    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.patientId) {
      where.patientId = filters.patientId;
    }

    const switches = await prisma.switchRecord.findMany({
      where,
      include: {
        patient: true,
        fromDrug: true,
        toDrug: true,
        appointments: {
          include: { followUp: true },
          orderBy: { scheduledAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return switches;
  }

  /**
   * Get switch by ID
   */
  async getSwitchById(id: string) {
    const switchRecord = await prisma.switchRecord.findUnique({
      where: { id },
      include: {
        patient: true,
        fromDrug: true,
        toDrug: true,
        appointments: {
          include: { followUp: true },
          orderBy: { scheduledAt: 'asc' },
        },
      },
    });

    if (!switchRecord) {
      throw new Error('Switch record not found');
    }

    return switchRecord;
  }

  /**
   * Get switches for a patient
   */
  async getPatientSwitches(patientId: string) {
    return this.getSwitches({ patientId });
  }

  /**
   * Record follow-up completion
   */
  async recordFollowUp(appointmentId: string, data: FollowUpData) {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { switch: true },
    });

    if (!appointment) {
      throw new Error('Appointment not found');
    }

    // Create or update follow-up record
    const followUp = await prisma.followUp.upsert({
      where: { appointmentId },
      create: {
        appointmentId,
        completedAt: new Date(),
        hasSideEffects: data.hasSideEffects,
        sideEffectSeverity: data.sideEffectSeverity,
        sideEffectDescription: data.sideEffectDescription,
        stillTakingMedication: data.stillTakingMedication,
        needsEscalation: data.sideEffectSeverity === 'SEVERE',
        patientSatisfaction: data.patientSatisfaction,
        notes: data.notes,
      },
      update: {
        completedAt: new Date(),
        hasSideEffects: data.hasSideEffects,
        sideEffectSeverity: data.sideEffectSeverity,
        sideEffectDescription: data.sideEffectDescription,
        stillTakingMedication: data.stillTakingMedication,
        needsEscalation: data.sideEffectSeverity === 'SEVERE',
        patientSatisfaction: data.patientSatisfaction,
        notes: data.notes,
      },
    });

    // Update appointment status
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    // Create alert if severe side effects
    if (data.sideEffectSeverity === 'SEVERE') {
      await prisma.alert.create({
        data: {
          type: 'SEVERE_REACTION',
          patientId: appointment.patientId,
          switchId: appointment.switchId,
          followUpId: followUp.id,
          description: `Severe side effects reported: ${data.sideEffectDescription || 'No description provided'}`,
          severity: 'SEVERE',
        },
      });

      // Mark switch as failed if severe reaction
      await prisma.switchRecord.update({
        where: { id: appointment.switchId },
        data: { status: 'FAILED' },
      });
    }

    // If patient stopped taking medication, mark switch as failed
    if (!data.stillTakingMedication) {
      await prisma.switchRecord.update({
        where: { id: appointment.switchId },
        data: { status: 'FAILED' },
      });

      await prisma.alert.create({
        data: {
          type: 'FAILED_SWITCH',
          patientId: appointment.patientId,
          switchId: appointment.switchId,
          followUpId: followUp.id,
          description: 'Patient discontinued biosimilar medication',
          severity: 'MODERATE',
        },
      });
    }

    // Auto-complete switch if both follow-ups are done and no failures
    if (data.stillTakingMedication && data.sideEffectSeverity !== 'SEVERE') {
      // Check if both Day 3 and Day 14 appointments are completed
      const allAppointments = await prisma.appointment.findMany({
        where: { switchId: appointment.switchId },
        include: { followUp: true },
      });

      const day3 = allAppointments.find(a => a.appointmentType === 'DAY_3');
      const day14 = allAppointments.find(a => a.appointmentType === 'DAY_14');

      const bothCompleted =
        day3?.status === 'COMPLETED' && day3?.followUp &&
        day14?.status === 'COMPLETED' && day14?.followUp;

      if (bothCompleted) {
        // Verify no severe side effects in either follow-up
        const day3FollowUp = day3.followUp;
        const day14FollowUp = day14.followUp;

        const noSevereReactions =
          day3FollowUp?.sideEffectSeverity !== 'SEVERE' &&
          day14FollowUp?.sideEffectSeverity !== 'SEVERE' &&
          day3FollowUp?.stillTakingMedication !== false &&
          day14FollowUp?.stillTakingMedication !== false;

        if (noSevereReactions) {
          const completedSwitch = await prisma.switchRecord.update({
            where: { id: appointment.switchId },
            data: {
              status: 'COMPLETED',
              completionDate: new Date(),
            },
            include: { patient: true, toDrug: true },
          });

          // Send switch-completed SMS
          this.sendSwitchCompletedSms(completedSwitch).catch((err: any) =>
            console.error('[SMS] Failed to send auto-complete SMS:', err?.message)
          );
        }
      }
    }

    return followUp;
  }

  /**
   * Get all appointments with optional filtering
   */
  async getAppointments(filters?: { status?: AppointmentStatus; patientId?: string; upcoming?: boolean }) {
    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.patientId) {
      where.patientId = filters.patientId;
    }

    if (filters?.upcoming) {
      where.scheduledAt = { gte: new Date() };
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        patient: true,
        switch: {
          include: {
            fromDrug: true,
            toDrug: true,
          },
        },
        followUp: true,
      },
      orderBy: { scheduledAt: 'asc' },
    });

    return appointments;
  }

  /**
   * Get dashboard statistics
   */
  async getDashboardStats() {
    const [
      totalSwitches,
      pendingSwitches,
      completedSwitches,
      failedCount,
      cancelledCount,
      upcomingFollowUpPatients,
      unreviewedAlerts,
    ] = await Promise.all([
      prisma.switchRecord.count(),
      prisma.switchRecord.count({ where: { status: 'PENDING' } }),
      prisma.switchRecord.count({ where: { status: 'COMPLETED' } }),
      prisma.switchRecord.count({ where: { status: 'FAILED' } }),
      prisma.switchRecord.count({ where: { status: 'CANCELLED' } }),
      prisma.appointment.findMany({
        where: {
          status: 'SCHEDULED',
          scheduledAt: { gte: new Date() },
          appointmentType: { in: ['DAY_3', 'DAY_14'] },
        },
        select: { patientId: true },
        distinct: ['patientId'],
      }),
      prisma.alert.count({ where: { reviewed: false } }),
    ]);

    // "Failed / Discontinued" combines FAILED + CANCELLED
    const failedSwitches = failedCount + cancelledCount;

    // Success rate = completed out of all resolved (completed + failed + cancelled)
    const totalResolved = completedSwitches + failedSwitches;
    const successRate = totalResolved > 0
      ? Math.round((completedSwitches / totalResolved) * 100)
      : 0;

    // Calculate savings from all active switches (PENDING + COMPLETED)
    const activeSwitchesData = await prisma.switchRecord.findMany({
      where: { status: { in: ['COMPLETED', 'PENDING'] } },
      include: { fromDrug: true, toDrug: true },
    });

    const totalMonthlySavings = activeSwitchesData.reduce((sum, s) => {
      return sum + (s.fromDrug.costPerMonth - s.toDrug.costPerMonth);
    }, 0);

    return {
      totalSwitches,
      pendingSwitches,
      completedSwitches,
      failedSwitches,
      successRate,
      upcomingAppointments: upcomingFollowUpPatients.length,
      unreviewedAlerts,
      totalMonthlySavings,
      totalAnnualSavings: totalMonthlySavings * 12,
    };
  }
}

export const switchService = new SwitchService();
