import { PrismaClient, SwitchStatus, AppointmentType, AppointmentStatus } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { drugService } from './drugService';

export interface EligibilityResult {
  eligible: boolean;
  patientId: string;
  currentDrug: any;
  recommendedBiosimilars: any[];
  reasons: string[];
  warnings: string[];
}

export interface CreateSwitchRequest {
  patientId: string;
  fromDrugId: string;
  toDrugId: string;
  eligibilityNotes?: string;
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
  'CHRONIC_KIDNEY_DISEASE_ANEMIA': ['Erythropoietin'],
  'CHEMOTHERAPY_ANEMIA': ['Erythropoietin'],
  'NEUTROPENIA': ['G-CSF'],
  'OSTEOPOROSIS': ['Bone Modifier'],
  'DIABETES_TYPE_2': ['GLP-1 Agonist', 'Insulin'],
};

// Allergy codes mapped to their related drug names/ingredients
const ALLERGY_DRUG_RELATIONSHIPS: Record<string, string[]> = {
  'ADALIMUMAB': ['humira', 'amjevita', 'hadlima', 'hyrimoz', 'cyltezo', 'adalimumab'],
  'INFLIXIMAB': ['remicade', 'inflectra', 'renflexis', 'avsola', 'infliximab'],
  'ETANERCEPT': ['enbrel', 'erelzi', 'eticovo', 'etanercept'],
  'RITUXIMAB': ['rituxan', 'truxima', 'ruxience', 'riabni', 'rituximab'],
  'TRASTUZUMAB': ['herceptin', 'ogivri', 'herzuma', 'ontruzant', 'kanjinti', 'trazimera', 'trastuzumab'],
  'BEVACIZUMAB': ['avastin', 'mvasi', 'zirabev', 'bevacizumab'],
  'PEGFILGRASTIM': ['neulasta', 'fulphila', 'udenyca', 'ziextenzo', 'nyvepria', 'pegfilgrastim'],
  'FILGRASTIM': ['neupogen', 'zarxio', 'nivestym', 'granix', 'releuko', 'filgrastim'],
  'MOUSE_PROTEIN': ['rituximab', 'infliximab', 'trastuzumab', 'bevacizumab'],
  'HAMSTER_PROTEIN': ['adalimumab', 'etanercept'],
  'ECOLI_PROTEIN': ['filgrastim', 'pegfilgrastim', 'insulin'],
  'POLYSORBATE': ['adalimumab', 'infliximab', 'rituximab', 'trastuzumab'],
  'LATEX': [], // Latex allergy doesn't affect drug eligibility, but is noted for injection devices
  'NKDA': [], // No Known Drug Allergies
};

export class SwitchService {
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
    // Get patient with diagnosis and allergy information
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        switches: {
          where: { status: 'PENDING' },
        },
      },
    });

    if (!patient) {
      throw new Error('Patient not found');
    }

    // Get current drug and its biosimilar alternatives
    const alternatives = await drugService.getBiosimilarAlternatives(currentDrugId);
    const { brandDrug, biosimilars } = alternatives;

    const reasons: string[] = [];
    const warnings: string[] = [];
    let eligible = true;

    // Check if patient has pending switches
    if (patient.switches.length > 0) {
      eligible = false;
      reasons.push('Patient has a pending switch that must be completed or cancelled first');
    }

    // Check if there are available biosimilars
    if (biosimilars.length === 0) {
      eligible = false;
      reasons.push('No approved biosimilar alternatives available for this medication');
    }

    // Check diagnosis-drug compatibility
    if (patient.diagnosis) {
      const compatibleClasses = DIAGNOSIS_DRUG_CLASS_MAP[patient.diagnosis] || [];
      const drugClass = brandDrug.therapeuticClass;

      if (compatibleClasses.length > 0 && drugClass) {
        const isCompatible = compatibleClasses.some(
          (c: string) => drugClass.toLowerCase().includes(c.toLowerCase()) ||
                        c.toLowerCase().includes(drugClass.toLowerCase())
        );

        if (isCompatible) {
          reasons.push(`Diagnosis confirmed: ${this.formatDiagnosis(patient.diagnosis)} is treated with ${drugClass} medications`);
        } else {
          warnings.push(`Note: Patient's diagnosis (${this.formatDiagnosis(patient.diagnosis)}) may not typically require ${drugClass} therapy. Please verify indication.`);
        }
      }
    } else {
      warnings.push('No diagnosis on file. Consider updating patient record with primary diagnosis for more accurate eligibility assessment.');
    }

    // Check for allergies that might affect eligibility
    if (patient.allergies) {
      const patientAllergyCodes = patient.allergies.split(',').map((a: string) => a.trim().toUpperCase());
      const hasNKDA = patientAllergyCodes.includes('NKDA');

      if (!hasNKDA) {
        // Check each allergy against the drug being prescribed
        const drugNameLower = brandDrug.name.toLowerCase();
        const activeIngredient = brandDrug.activeIngredient?.toLowerCase() || '';

        let hasContraindication = false;
        const contraindicatedAllergies: string[] = [];

        for (const allergyCode of patientAllergyCodes) {
          const relatedDrugs = ALLERGY_DRUG_RELATIONSHIPS[allergyCode] || [];

          // Check if any related drug matches the brand drug or active ingredient
          const isContraindicated = relatedDrugs.some((drug: string) =>
            drugNameLower.includes(drug.toLowerCase()) ||
            activeIngredient.includes(drug.toLowerCase()) ||
            drug.toLowerCase().includes(drugNameLower) ||
            drug.toLowerCase().includes(activeIngredient)
          );

          if (isContraindicated) {
            hasContraindication = true;
            contraindicatedAllergies.push(allergyCode);
          }
        }

        if (hasContraindication) {
          eligible = false;
          reasons.push(`Patient has documented allergy (${contraindicatedAllergies.join(', ')}) that may be contraindicated with ${brandDrug.name}`);
        } else {
          // General warning about allergies for awareness
          const allergyList = patientAllergyCodes.filter((a: string) => a !== 'NKDA').join(', ');
          if (allergyList) {
            warnings.push(`Patient has documented allergies: ${allergyList}. Please verify no contraindications with biosimilar formulation.`);
          }
        }
      }
    }

    // Check for interchangeable biosimilars (preferred for pharmacy-level substitution)
    const interchangeableBiosimilars = biosimilars.filter(
      (b: any) => b.interchangeability === 'INTERCHANGEABLE'
    );

    if (interchangeableBiosimilars.length > 0) {
      reasons.push(`${interchangeableBiosimilars.length} FDA-designated interchangeable biosimilar(s) available - can be substituted at pharmacy without prescriber intervention`);
    }

    // Add cost savings info
    if (biosimilars.length > 0) {
      const bestSavings = biosimilars[0]; // Already sorted by savings
      reasons.push(`Potential savings: up to $${bestSavings.annualSavings.toLocaleString()}/year (${bestSavings.savingsPercent}% reduction)`);
    }

    return {
      eligible,
      patientId,
      currentDrug: brandDrug,
      recommendedBiosimilars: biosimilars,
      reasons,
      warnings,
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
   * Create a new switch record
   */
  async createSwitch(data: CreateSwitchRequest) {
    const { patientId, fromDrugId, toDrugId, eligibilityNotes } = data;

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

    // Create switch record
    const switchRecord = await prisma.switchRecord.create({
      data: {
        patientId,
        fromDrugId,
        toDrugId,
        switchDate: new Date(),
        status: 'PENDING',
        eligibilityNotes,
        consentObtained: false,
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
    const updatedSwitch = await prisma.switchRecord.update({
      where: { id: switchId },
      data: {
        consentObtained,
        consentTimestamp: consentObtained ? new Date() : null,
        consentText: consentObtained ? consentText : null,
      },
      include: {
        patient: true,
        fromDrug: true,
        toDrug: true,
      },
    });

    // If consent obtained, schedule follow-up appointments
    if (consentObtained) {
      await this.scheduleFollowUpAppointments(switchId, switchRecord.patientId);
    }

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

    return updatedSwitch;
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
          await prisma.switchRecord.update({
            where: { id: appointment.switchId },
            data: {
              status: 'COMPLETED',
              completionDate: new Date(),
            },
          });
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
      failedSwitches,
      upcomingAppointments,
      unreviewedAlerts,
    ] = await Promise.all([
      prisma.switchRecord.count(),
      prisma.switchRecord.count({ where: { status: 'PENDING' } }),
      prisma.switchRecord.count({ where: { status: 'COMPLETED' } }),
      prisma.switchRecord.count({ where: { status: 'FAILED' } }),
      prisma.appointment.count({
        where: {
          status: 'SCHEDULED',
          scheduledAt: { gte: new Date() },
        },
      }),
      prisma.alert.count({ where: { reviewed: false } }),
    ]);

    // Calculate success rate
    const totalProcessed = completedSwitches + failedSwitches;
    const successRate = totalProcessed > 0
      ? Math.round((completedSwitches / totalProcessed) * 100)
      : 0;

    // Calculate total savings from completed switches
    const completedSwitchesData = await prisma.switchRecord.findMany({
      where: { status: 'COMPLETED' },
      include: { fromDrug: true, toDrug: true },
    });

    const totalMonthlySavings = completedSwitchesData.reduce((sum, s) => {
      return sum + (s.fromDrug.costPerMonth - s.toDrug.costPerMonth);
    }, 0);

    return {
      totalSwitches,
      pendingSwitches,
      completedSwitches,
      failedSwitches,
      successRate,
      upcomingAppointments,
      unreviewedAlerts,
      totalMonthlySavings,
      totalAnnualSavings: totalMonthlySavings * 12,
    };
  }
}

export const switchService = new SwitchService();
