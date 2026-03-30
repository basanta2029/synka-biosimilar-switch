import { PrismaClient, DrugType, InterchangeabilityStatus } from '@prisma/client';
import { prisma } from '../utils/prisma';
import nhisCoverageMap from '../data/nhis2025-biosimilar-map.json';

type NhisVerificationStatus = 'MATCHED_NHIS_2025' | 'NOT_FOUND_IN_NHIS_2025' | 'NEEDS_MANUAL_REVIEW';

interface NhisCoverageSnapshot {
  verificationStatus: NhisVerificationStatus;
  isListed: boolean;
  matchedOn: 'ACTIVE_INGREDIENT' | 'GENERIC_NAME' | null;
  notes: string;
  pricing?: {
    nhisCode: string;
    genericName: string;
    unitOfPricing: string;
    priceGhs: number;
    levelOfPrescribing: string;
    sourceVersion: string;
  };
}

interface NhisCoverageMapFile {
  sourceVersion: string;
  lastReviewedAt: string;
  notes: string;
  ingredients: Record<string, Omit<NhisCoverageSnapshot, 'matchedOn' | 'pricing'> & {
    pricing?: Omit<NonNullable<NhisCoverageSnapshot['pricing']>, 'sourceVersion'>;
  }>;
}

const NHIS_2025_COVERAGE_MAP = nhisCoverageMap as NhisCoverageMapFile;
const NHIS_2025_INGREDIENT_COVERAGE: Record<string, Omit<NhisCoverageSnapshot, 'matchedOn'>> = Object.fromEntries(
  Object.entries(NHIS_2025_COVERAGE_MAP.ingredients).map(([key, value]) => [
    key,
    {
      ...value,
      pricing: value.pricing
        ? {
            ...value.pricing,
            sourceVersion: NHIS_2025_COVERAGE_MAP.sourceVersion,
          }
        : undefined,
    },
  ])
);

interface NhisCoverageReportItem {
  ingredient: string;
  verificationStatus: NhisVerificationStatus;
  isListed: boolean;
  notes: string;
  pricing?: NhisCoverageSnapshot['pricing'];
}

interface NhisCoverageReport {
  sourceVersion: string;
  lastReviewedAt: string;
  notes: string;
  totalMappedIngredients: number;
  listedCount: number;
  unmappedOrReviewCount: number;
  items: NhisCoverageReportItem[];
}

const DEFAULT_NHIS_SNAPSHOT: NhisCoverageSnapshot = {
  verificationStatus: 'NEEDS_MANUAL_REVIEW',
  isListed: false,
  matchedOn: null,
  notes:
    'No NHIS 2025 mapping found for this product in prototype rules. Requires manual pharmacy/regulatory review.',
};

export class DrugService {
  /**
   * Prototype NHIS cross-check:
   * - Uses NHIS 2025 snapshot mappings by active ingredient/generic name.
   * - Returns verification metadata so UI can avoid over-claiming coverage.
   */
  private getNhisCoverageSnapshot(drug: any): NhisCoverageSnapshot {
    const ingredient = (drug.activeIngredient || '').toLowerCase();
    const name = (drug.name || '').toLowerCase();
    const candidates = Object.keys(NHIS_2025_INGREDIENT_COVERAGE);

    for (const key of candidates) {
      if (ingredient.includes(key)) {
        return {
          ...NHIS_2025_INGREDIENT_COVERAGE[key],
          matchedOn: 'ACTIVE_INGREDIENT',
        };
      }
      if (name.includes(key)) {
        return {
          ...NHIS_2025_INGREDIENT_COVERAGE[key],
          matchedOn: 'GENERIC_NAME',
        };
      }
    }

    return DEFAULT_NHIS_SNAPSHOT;
  }

  /**
   * Returns the current NHIS prototype coverage map for admin/review use.
   */
  getNhisCoverageReport(): NhisCoverageReport {
    const items: NhisCoverageReportItem[] = Object.entries(NHIS_2025_INGREDIENT_COVERAGE).map(
      ([ingredient, snapshot]) => ({
        ingredient,
        verificationStatus: snapshot.verificationStatus,
        isListed: snapshot.isListed,
        notes: snapshot.notes,
        pricing: snapshot.pricing,
      })
    );

    const listedCount = items.filter((item) => item.isListed).length;

    return {
      sourceVersion: NHIS_2025_COVERAGE_MAP.sourceVersion,
      lastReviewedAt: NHIS_2025_COVERAGE_MAP.lastReviewedAt,
      notes: NHIS_2025_COVERAGE_MAP.notes,
      totalMappedIngredients: items.length,
      listedCount,
      unmappedOrReviewCount: items.length - listedCount,
      items,
    };
  }

  /**
   * Get all drugs with optional filtering by type
   */
  async getDrugs(type?: DrugType) {
    const where = type ? { type } : {};

    const drugs = await prisma.drug.findMany({
      where,
      include: {
        referenceProduct: true,
        biosimilars: true,
      },
      orderBy: [{ type: 'asc' }, { therapeuticClass: 'asc' }, { name: 'asc' }],
    });

    return drugs;
  }

  /**
   * Get drug by ID
   */
  async getDrugById(id: string) {
    const drug = await prisma.drug.findUnique({
      where: { id },
      include: {
        referenceProduct: true,
        biosimilars: true,
      },
    });

    if (!drug) {
      throw new Error('Drug not found');
    }

    return drug;
  }

  /**
   * Get biosimilar alternatives for a brand drug
   * Uses referenceProductId relationship for accurate matching
   */
  async getBiosimilarAlternatives(brandDrugId: string) {
    // Get the brand drug
    const brandDrug = await prisma.drug.findUnique({
      where: { id: brandDrugId },
    });

    if (!brandDrug) {
      throw new Error('Brand drug not found');
    }

    if (brandDrug.type !== 'BRAND') {
      throw new Error('Drug must be a brand-name drug');
    }

    // Find biosimilars that reference this brand drug
    const biosimilars = await prisma.drug.findMany({
      where: {
        type: 'BIOSIMILAR',
        referenceProductId: brandDrugId,
        approvedForSwitch: true,
      },
      orderBy: [
        // Biosimilars with stronger interchangeability data from strict NRAs first,
        // then lowest cost options. Ghana FDA still requires a prescriber decision.
        { interchangeability: 'desc' },
        { costPerMonth: 'asc' },
      ],
    });

    // Calculate savings for each biosimilar
    const biosimilarsWithSavings = biosimilars.map((biosimilar) => {
      const monthlySavings = brandDrug.costPerMonth - biosimilar.costPerMonth;
      const annualSavings = monthlySavings * 12;
      const savingsPercent = (monthlySavings / brandDrug.costPerMonth) * 100;

      return {
        ...biosimilar,
        monthlySavings,
        annualSavings,
        savingsPercent: Math.round(savingsPercent),
        nhisCoverage: this.getNhisCoverageSnapshot(biosimilar),
      };
    });

    return {
      brandDrug,
      biosimilars: biosimilarsWithSavings,
      totalBiosimilars: biosimilars.length,
      interchangeableCount: biosimilars.filter(b => b.interchangeability === 'INTERCHANGEABLE').length,
    };
  }

  /**
   * Seed database with example reference and biosimilar drugs
   * Demo data based on international sources (e.g., US FDA Purple Book)
   * and intended only for development, not for real clinical deployment.
   */
  async seedDrugs() {
    // First, clear existing drugs to avoid duplicates
    await prisma.drug.deleteMany({});

    // ========================================
    // REFERENCE PRODUCTS (BRAND DRUGS)
    // ========================================
    const brandDrugs = [
      // Adalimumab - Anti-TNF (reference product example)
      {
        name: 'Humira',
        type: 'BRAND' as DrugType,
        costPerMonth: 6922,
        approvedForSwitch: true,
        therapeuticClass: 'TNF-Blocker',
        manufacturer: 'AbbVie Inc.',
        description: 'Reference anti-TNF biologic for rheumatoid arthritis, Crohn\'s disease, ulcerative colitis, plaque psoriasis, and other inflammatory conditions',
        activeIngredient: 'adalimumab',
        blaNumber: 'BLA 125057',
        fdaApprovalDate: new Date('2002-12-31'),
        interchangeability: 'NOT_APPLICABLE' as InterchangeabilityStatus,
        indications: 'Rheumatoid Arthritis, Juvenile Idiopathic Arthritis, Psoriatic Arthritis, Ankylosing Spondylitis, Crohn\'s Disease, Ulcerative Colitis, Plaque Psoriasis, Hidradenitis Suppurativa, Uveitis',
        administrationRoute: 'Subcutaneous injection',
      },
      // Infliximab - Anti-TNF (reference product example)
      {
        name: 'Remicade',
        type: 'BRAND' as DrugType,
        costPerMonth: 4500,
        approvedForSwitch: true,
        therapeuticClass: 'TNF-Blocker',
        manufacturer: 'Janssen Biotech, Inc.',
        description: 'Reference anti-TNF biologic for rheumatoid arthritis, Crohn\'s disease, ulcerative colitis, and psoriasis',
        activeIngredient: 'infliximab',
        blaNumber: 'BLA 103772',
        fdaApprovalDate: new Date('1998-08-24'),
        interchangeability: 'NOT_APPLICABLE' as InterchangeabilityStatus,
        indications: 'Crohn\'s Disease, Ulcerative Colitis, Rheumatoid Arthritis, Ankylosing Spondylitis, Psoriatic Arthritis, Plaque Psoriasis',
        administrationRoute: 'Intravenous infusion',
      },
      // Etanercept - Anti-TNF (reference product example)
      {
        name: 'Enbrel',
        type: 'BRAND' as DrugType,
        costPerMonth: 4944,
        approvedForSwitch: true,
        therapeuticClass: 'TNF-Blocker',
        manufacturer: 'Amgen Inc.',
        description: 'Reference anti-TNF biologic for rheumatoid arthritis, psoriatic arthritis, and ankylosing spondylitis',
        activeIngredient: 'etanercept',
        blaNumber: 'BLA 103795',
        fdaApprovalDate: new Date('1998-11-02'),
        interchangeability: 'NOT_APPLICABLE' as InterchangeabilityStatus,
        indications: 'Rheumatoid Arthritis, Polyarticular Juvenile Idiopathic Arthritis, Psoriatic Arthritis, Ankylosing Spondylitis, Plaque Psoriasis',
        administrationRoute: 'Subcutaneous injection',
      },
      // Trastuzumab - HER2 (reference product example)
      {
        name: 'Herceptin',
        type: 'BRAND' as DrugType,
        costPerMonth: 4500,
        approvedForSwitch: true,
        therapeuticClass: 'HER2-Blocker',
        manufacturer: 'Genentech, Inc.',
        description: 'Reference HER2-targeted therapy for HER2-positive breast cancer and gastric cancer',
        activeIngredient: 'trastuzumab',
        blaNumber: 'BLA 103792',
        fdaApprovalDate: new Date('1998-09-25'),
        interchangeability: 'NOT_APPLICABLE' as InterchangeabilityStatus,
        indications: 'HER2-Overexpressing Breast Cancer, HER2-Overexpressing Metastatic Gastric or Gastroesophageal Junction Adenocarcinoma',
        administrationRoute: 'Intravenous infusion',
      },
      // Filgrastim - G-CSF (reference product example)
      {
        name: 'Neupogen',
        type: 'BRAND' as DrugType,
        costPerMonth: 3500,
        approvedForSwitch: true,
        therapeuticClass: 'G-CSF',
        manufacturer: 'Amgen Inc.',
        description: 'Reference G-CSF for neutropenia prevention and treatment in cancer patients',
        activeIngredient: 'filgrastim',
        blaNumber: 'BLA 103353',
        fdaApprovalDate: new Date('1991-02-20'),
        interchangeability: 'NOT_APPLICABLE' as InterchangeabilityStatus,
        indications: 'Chemotherapy-Induced Neutropenia, Bone Marrow Transplant, Peripheral Blood Progenitor Cell Collection, Severe Chronic Neutropenia, Acute Radiation Syndrome',
        administrationRoute: 'Subcutaneous or Intravenous',
      },
      {
        name: 'MabThera',
        type: 'BRAND' as DrugType,
        costPerMonth: 6900,
        approvedForSwitch: true,
        therapeuticClass: 'Anti-CD20',
        manufacturer: 'Roche',
        description: 'Reference anti-CD20 biologic used for NHL/CLL and autoimmune indications in specialist care.',
        activeIngredient: 'rituximab',
        blaNumber: 'REFERENCE_PRODUCT',
        fdaApprovalDate: new Date('1997-11-26'),
        interchangeability: 'NOT_APPLICABLE' as InterchangeabilityStatus,
        indications: 'Non-Hodgkin Lymphoma, CLL, Rheumatoid Arthritis',
        administrationRoute: 'Intravenous infusion',
      },
      {
        name: 'Lucentis',
        type: 'BRAND' as DrugType,
        costPerMonth: 4800,
        approvedForSwitch: true,
        therapeuticClass: 'Anti-VEGF',
        manufacturer: 'Novartis / Genentech',
        description: 'Reference anti-VEGF biologic for retinal vascular disorders.',
        activeIngredient: 'ranibizumab',
        blaNumber: 'REFERENCE_PRODUCT',
        fdaApprovalDate: new Date('2006-06-30'),
        interchangeability: 'NOT_APPLICABLE' as InterchangeabilityStatus,
        indications: 'Age-related Macular Degeneration, Diabetic Macular Edema',
        administrationRoute: 'Intravitreal injection',
      },
      {
        name: 'Eprex',
        type: 'BRAND' as DrugType,
        costPerMonth: 420,
        approvedForSwitch: true,
        therapeuticClass: 'Erythropoietin',
        manufacturer: 'Janssen',
        description: 'Reference erythropoiesis-stimulating biologic for anemia in CKD and oncology settings.',
        activeIngredient: 'epoetin alfa',
        blaNumber: 'REFERENCE_PRODUCT',
        fdaApprovalDate: new Date('1989-06-01'),
        interchangeability: 'NOT_APPLICABLE' as InterchangeabilityStatus,
        indications: 'Anemia of Chronic Kidney Disease, Chemotherapy-related Anemia',
        administrationRoute: 'Subcutaneous or Intravenous',
      },
    ];

    // Create brand drugs first
    const createdBrands: Record<string, any> = {};
    for (const drug of brandDrugs) {
      const result = await prisma.drug.create({ data: drug });
      createdBrands[drug.activeIngredient!] = result;
    }

    // ========================================
    // BIOSIMILARS - EXAMPLE DATA FROM STRICT NRAs
    // ========================================
    const biosimilars = [
      // ---- ADALIMUMAB (Humira) Biosimilars (examples) ----
      {
        name: 'Amjevita',
        type: 'BIOSIMILAR' as DrugType,
        costPerMonth: 1800,
        approvedForSwitch: true,
        therapeuticClass: 'TNF-Blocker',
        manufacturer: 'Amgen Inc.',
        description: 'Example adalimumab biosimilar with interchangeability designation in a strict NRA.',
        activeIngredient: 'adalimumab-atto',
        fdaSuffix: '-atto',
        blaNumber: 'BLA 761024',
        fdaApprovalDate: new Date('2016-09-23'),
        interchangeability: 'INTERCHANGEABLE' as InterchangeabilityStatus,
        referenceProductId: createdBrands['adalimumab'].id,
        indications: 'Rheumatoid Arthritis, Juvenile Idiopathic Arthritis, Psoriatic Arthritis, Ankylosing Spondylitis, Crohn\'s Disease, Ulcerative Colitis, Plaque Psoriasis',
        administrationRoute: 'Subcutaneous injection',
      },
      {
        name: 'Cyltezo',
        type: 'BIOSIMILAR' as DrugType,
        costPerMonth: 1950,
        approvedForSwitch: true,
        therapeuticClass: 'TNF-Blocker',
        manufacturer: 'Boehringer Ingelheim',
        description: 'Example adalimumab biosimilar with interchangeability designation in a strict NRA.',
        activeIngredient: 'adalimumab-adbm',
        fdaSuffix: '-adbm',
        blaNumber: 'BLA 761058',
        fdaApprovalDate: new Date('2017-08-25'),
        interchangeability: 'INTERCHANGEABLE' as InterchangeabilityStatus,
        referenceProductId: createdBrands['adalimumab'].id,
        indications: 'Rheumatoid Arthritis, Juvenile Idiopathic Arthritis, Psoriatic Arthritis, Ankylosing Spondylitis, Crohn\'s Disease, Ulcerative Colitis, Plaque Psoriasis',
        administrationRoute: 'Subcutaneous injection',
      },
      {
        name: 'Hadlima',
        type: 'BIOSIMILAR' as DrugType,
        costPerMonth: 1700,
        approvedForSwitch: true,
        therapeuticClass: 'TNF-Blocker',
        manufacturer: 'Samsung Bioepis / Organon',
        description: 'Citrate-free adalimumab biosimilar with interchangeability designation in a strict NRA.',
        activeIngredient: 'adalimumab-bwwd',
        fdaSuffix: '-bwwd',
        blaNumber: 'BLA 761059',
        fdaApprovalDate: new Date('2019-07-23'),
        interchangeability: 'INTERCHANGEABLE' as InterchangeabilityStatus,
        referenceProductId: createdBrands['adalimumab'].id,
        indications: 'Rheumatoid Arthritis, Juvenile Idiopathic Arthritis, Psoriatic Arthritis, Ankylosing Spondylitis, Crohn\'s Disease, Ulcerative Colitis, Plaque Psoriasis',
        administrationRoute: 'Subcutaneous injection',
      },
      {
        name: 'Hyrimoz',
        type: 'BIOSIMILAR' as DrugType,
        costPerMonth: 1650,
        approvedForSwitch: true,
        therapeuticClass: 'TNF-Blocker',
        manufacturer: 'Sandoz Inc.',
        description: 'Adalimumab biosimilar from Sandoz with interchangeability designation in a strict NRA.',
        activeIngredient: 'adalimumab-adaz',
        fdaSuffix: '-adaz',
        blaNumber: 'BLA 761071',
        fdaApprovalDate: new Date('2018-10-30'),
        interchangeability: 'INTERCHANGEABLE' as InterchangeabilityStatus,
        referenceProductId: createdBrands['adalimumab'].id,
        indications: 'Rheumatoid Arthritis, Juvenile Idiopathic Arthritis, Psoriatic Arthritis, Ankylosing Spondylitis, Crohn\'s Disease, Ulcerative Colitis, Plaque Psoriasis',
        administrationRoute: 'Subcutaneous injection',
      },
      {
        name: 'Yuflyma',
        type: 'BIOSIMILAR' as DrugType,
        costPerMonth: 1600,
        approvedForSwitch: true,
        therapeuticClass: 'TNF-Blocker',
        manufacturer: 'Celltrion USA, Inc.',
        description: 'High-concentration, citrate-free adalimumab biosimilar example.',
        activeIngredient: 'adalimumab-aaty',
        fdaSuffix: '-aaty',
        blaNumber: 'BLA 761182',
        fdaApprovalDate: new Date('2023-03-01'),
        interchangeability: 'INTERCHANGEABLE' as InterchangeabilityStatus,
        referenceProductId: createdBrands['adalimumab'].id,
        indications: 'Rheumatoid Arthritis, Juvenile Idiopathic Arthritis, Psoriatic Arthritis, Ankylosing Spondylitis, Crohn\'s Disease, Ulcerative Colitis, Plaque Psoriasis',
        administrationRoute: 'Subcutaneous injection',
      },

      // ---- INFLIXIMAB (Remicade) Biosimilars (examples) ----
      {
        name: 'Inflectra',
        type: 'BIOSIMILAR' as DrugType,
        costPerMonth: 1400,
        approvedForSwitch: true,
        therapeuticClass: 'TNF-Blocker',
        manufacturer: 'Celltrion / Pfizer',
        description: 'First infliximab biosimilar approved by a strict NRA.',
        activeIngredient: 'infliximab-dyyb',
        fdaSuffix: '-dyyb',
        blaNumber: 'BLA 125544',
        fdaApprovalDate: new Date('2016-04-05'),
        interchangeability: 'BIOSIMILAR' as InterchangeabilityStatus,
        referenceProductId: createdBrands['infliximab'].id,
        indications: 'Crohn\'s Disease, Ulcerative Colitis, Rheumatoid Arthritis, Ankylosing Spondylitis, Psoriatic Arthritis, Plaque Psoriasis',
        administrationRoute: 'Intravenous infusion',
      },
      {
        name: 'Renflexis',
        type: 'BIOSIMILAR' as DrugType,
        costPerMonth: 1500,
        approvedForSwitch: true,
        therapeuticClass: 'TNF-Blocker',
        manufacturer: 'Samsung Bioepis',
        description: 'Infliximab biosimilar approved for all reference indications by a strict NRA.',
        activeIngredient: 'infliximab-abda',
        fdaSuffix: '-abda',
        blaNumber: 'BLA 761054',
        fdaApprovalDate: new Date('2017-04-21'),
        interchangeability: 'BIOSIMILAR' as InterchangeabilityStatus,
        referenceProductId: createdBrands['infliximab'].id,
        indications: 'Crohn\'s Disease, Ulcerative Colitis, Rheumatoid Arthritis, Ankylosing Spondylitis, Psoriatic Arthritis, Plaque Psoriasis',
        administrationRoute: 'Intravenous infusion',
      },
      {
        name: 'Avsola',
        type: 'BIOSIMILAR' as DrugType,
        costPerMonth: 1450,
        approvedForSwitch: true,
        therapeuticClass: 'TNF-Blocker',
        manufacturer: 'Amgen Inc.',
        description: 'Infliximab biosimilar from Amgen.',
        activeIngredient: 'infliximab-axxq',
        fdaSuffix: '-axxq',
        blaNumber: 'BLA 761086',
        fdaApprovalDate: new Date('2019-12-06'),
        interchangeability: 'BIOSIMILAR' as InterchangeabilityStatus,
        referenceProductId: createdBrands['infliximab'].id,
        indications: 'Crohn\'s Disease, Ulcerative Colitis, Rheumatoid Arthritis, Ankylosing Spondylitis, Psoriatic Arthritis, Plaque Psoriasis',
        administrationRoute: 'Intravenous infusion',
      },

      // ---- TRASTUZUMAB (Herceptin) Biosimilars (examples) ----
      {
        name: 'Ogivri',
        type: 'BIOSIMILAR' as DrugType,
        costPerMonth: 1800,
        approvedForSwitch: true,
        therapeuticClass: 'HER2-Blocker',
        manufacturer: 'Mylan / Viatris',
        description: 'First trastuzumab biosimilar for HER2-positive cancers approved by a strict NRA.',
        activeIngredient: 'trastuzumab-dkst',
        fdaSuffix: '-dkst',
        blaNumber: 'BLA 761074',
        fdaApprovalDate: new Date('2017-12-01'),
        interchangeability: 'BIOSIMILAR' as InterchangeabilityStatus,
        referenceProductId: createdBrands['trastuzumab'].id,
        indications: 'HER2-Overexpressing Breast Cancer, HER2-Overexpressing Metastatic Gastric or Gastroesophageal Junction Adenocarcinoma',
        administrationRoute: 'Intravenous infusion',
      },
      {
        name: 'Herzuma',
        type: 'BIOSIMILAR' as DrugType,
        costPerMonth: 1750,
        approvedForSwitch: true,
        therapeuticClass: 'HER2-Blocker',
        manufacturer: 'Celltrion / Teva',
        description: 'Trastuzumab biosimilar for HER2-positive breast and gastric cancers.',
        activeIngredient: 'trastuzumab-pkrb',
        fdaSuffix: '-pkrb',
        blaNumber: 'BLA 761091',
        fdaApprovalDate: new Date('2018-12-14'),
        interchangeability: 'BIOSIMILAR' as InterchangeabilityStatus,
        referenceProductId: createdBrands['trastuzumab'].id,
        indications: 'HER2-Overexpressing Breast Cancer, HER2-Overexpressing Metastatic Gastric or Gastroesophageal Junction Adenocarcinoma',
        administrationRoute: 'Intravenous infusion',
      },
      {
        name: 'Kanjinti',
        type: 'BIOSIMILAR' as DrugType,
        costPerMonth: 1700,
        approvedForSwitch: true,
        therapeuticClass: 'HER2-Blocker',
        manufacturer: 'Amgen Inc.',
        description: 'Trastuzumab biosimilar approved based on comprehensive comparative data in a strict NRA.',
        activeIngredient: 'trastuzumab-anns',
        fdaSuffix: '-anns',
        blaNumber: 'BLA 761073',
        fdaApprovalDate: new Date('2019-06-13'),
        interchangeability: 'BIOSIMILAR' as InterchangeabilityStatus,
        referenceProductId: createdBrands['trastuzumab'].id,
        indications: 'HER2-Overexpressing Breast Cancer, HER2-Overexpressing Metastatic Gastric or Gastroesophageal Junction Adenocarcinoma',
        administrationRoute: 'Intravenous infusion',
      },

      // ---- FILGRASTIM (Neupogen) Biosimilars (examples) ----
      {
        name: 'Zarxio',
        type: 'BIOSIMILAR' as DrugType,
        costPerMonth: 1200,
        approvedForSwitch: true,
        therapeuticClass: 'G-CSF',
        manufacturer: 'Sandoz Inc.',
        description: 'First filgrastim biosimilar approved by a strict NRA (March 2015).',
        activeIngredient: 'filgrastim-sndz',
        fdaSuffix: '-sndz',
        blaNumber: 'BLA 125553',
        fdaApprovalDate: new Date('2015-03-06'),
        interchangeability: 'BIOSIMILAR' as InterchangeabilityStatus,
        referenceProductId: createdBrands['filgrastim'].id,
        indications: 'Chemotherapy-Induced Neutropenia, Bone Marrow Transplant, Peripheral Blood Progenitor Cell Collection, Severe Chronic Neutropenia, Acute Radiation Syndrome',
        administrationRoute: 'Subcutaneous or Intravenous',
      },
      {
        name: 'Nivestym',
        type: 'BIOSIMILAR' as DrugType,
        costPerMonth: 1100,
        approvedForSwitch: true,
        therapeuticClass: 'G-CSF',
        manufacturer: 'Pfizer Inc.',
        description: 'Filgrastim biosimilar for neutropenia prevention.',
        activeIngredient: 'filgrastim-aafi',
        fdaSuffix: '-aafi',
        blaNumber: 'BLA 761080',
        fdaApprovalDate: new Date('2018-07-20'),
        interchangeability: 'BIOSIMILAR' as InterchangeabilityStatus,
        referenceProductId: createdBrands['filgrastim'].id,
        indications: 'Chemotherapy-Induced Neutropenia, Bone Marrow Transplant, Peripheral Blood Progenitor Cell Collection, Severe Chronic Neutropenia, Acute Radiation Syndrome',
        administrationRoute: 'Subcutaneous or Intravenous',
      },
      {
        name: 'Truxima',
        type: 'BIOSIMILAR' as DrugType,
        costPerMonth: 5100,
        approvedForSwitch: true,
        therapeuticClass: 'Anti-CD20',
        manufacturer: 'Celltrion',
        description:
          'Prototype rituximab biosimilar entry for Ghana workflow testing; final availability must be confirmed against Ghana FDA product register.',
        activeIngredient: 'rituximab-abbs',
        fdaSuffix: '-abbs',
        blaNumber: 'BLA 761088',
        fdaApprovalDate: new Date('2018-11-28'),
        interchangeability: 'BIOSIMILAR' as InterchangeabilityStatus,
        referenceProductId: createdBrands['rituximab'].id,
        indications: 'Non-Hodgkin Lymphoma, CLL, Rheumatoid Arthritis',
        administrationRoute: 'Intravenous infusion',
      },
      {
        name: 'BioUcenta',
        type: 'BIOSIMILAR' as DrugType,
        costPerMonth: 2100,
        approvedForSwitch: true,
        therapeuticClass: 'Anti-VEGF',
        manufacturer: 'Prototype / pending local verification',
        description:
          'Prototype ranibizumab biosimilar candidate for app workflows. Do not treat as verified Ghana registration without official evidence links.',
        activeIngredient: 'ranibizumab',
        fdaSuffix: null,
        blaNumber: 'PROTOTYPE_ONLY',
        fdaApprovalDate: null,
        interchangeability: 'BIOSIMILAR' as InterchangeabilityStatus,
        referenceProductId: createdBrands['ranibizumab'].id,
        indications: 'Age-related Macular Degeneration, Diabetic Macular Edema',
        administrationRoute: 'Intravitreal injection',
      },
      {
        name: 'Binocrit',
        type: 'BIOSIMILAR' as DrugType,
        costPerMonth: 250,
        approvedForSwitch: true,
        therapeuticClass: 'Erythropoietin',
        manufacturer: 'Sandoz',
        description:
          'Prototype epoetin alfa biosimilar candidate for app workflows. Keep as unverified until Ghana FDA + NHIS evidence is attached.',
        activeIngredient: 'epoetin alfa',
        fdaSuffix: null,
        blaNumber: 'PROTOTYPE_ONLY',
        fdaApprovalDate: null,
        interchangeability: 'BIOSIMILAR' as InterchangeabilityStatus,
        referenceProductId: createdBrands['epoetin alfa'].id,
        indications: 'Anemia of Chronic Kidney Disease, Chemotherapy-related Anemia',
        administrationRoute: 'Subcutaneous or Intravenous',
      },
    ];

    // Create biosimilars
    const createdBiosimilars = [];
    for (const drug of biosimilars) {
      const result = await prisma.drug.create({ data: drug });
      createdBiosimilars.push(result);
    }

    const allDrugs = [...Object.values(createdBrands), ...createdBiosimilars];

    return {
      message: 'Example reference and biosimilar drugs seeded successfully (demo data only)',
      count: allDrugs.length,
      summary: {
        referenceProducts: Object.keys(createdBrands).length,
        biosimilars: createdBiosimilars.length,
        interchangeable: createdBiosimilars.filter(d => d.interchangeability === 'INTERCHANGEABLE').length,
      },
      drugs: allDrugs,
    };
  }

  /**
   * Get drugs by therapeutic class
   */
  async getDrugsByTherapeuticClass(therapeuticClass: string) {
    const drugs = await prisma.drug.findMany({
      where: { therapeuticClass },
      include: {
        referenceProduct: true,
        biosimilars: true,
      },
      orderBy: [{ type: 'asc' }, { costPerMonth: 'asc' }],
    });

    return drugs;
  }

  /**
   * Get all interchangeable biosimilars
   */
  async getInterchangeableBiosimilars() {
    const drugs = await prisma.drug.findMany({
      where: {
        interchangeability: 'INTERCHANGEABLE',
        approvedForSwitch: true,
      },
      include: {
        referenceProduct: true,
      },
      orderBy: [{ therapeuticClass: 'asc' }, { name: 'asc' }],
    });

    return drugs;
  }
}

export const drugService = new DrugService();
