import { PrismaClient, DrugType, InterchangeabilityStatus } from '@prisma/client';
import { prisma } from '../utils/prisma';

export class DrugService {
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
        { interchangeability: 'desc' }, // Interchangeable first
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
   * Seed database with FDA Purple Book approved drugs
   * Data sourced from: https://purplebooksearch.fda.gov/
   */
  async seedDrugs() {
    // First, clear existing drugs to avoid duplicates
    await prisma.drug.deleteMany({});

    // ========================================
    // REFERENCE PRODUCTS (BRAND DRUGS)
    // ========================================
    const brandDrugs = [
      // Adalimumab - Anti-TNF
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
      // Infliximab - Anti-TNF
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
      // Etanercept - Anti-TNF
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
      // Trastuzumab - HER2
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
      // Filgrastim - G-CSF
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
    ];

    // Create brand drugs first
    const createdBrands: Record<string, any> = {};
    for (const drug of brandDrugs) {
      const result = await prisma.drug.create({ data: drug });
      createdBrands[drug.activeIngredient!] = result;
    }

    // ========================================
    // BIOSIMILARS - FDA Purple Book Approved
    // ========================================
    const biosimilars = [
      // ---- ADALIMUMAB (Humira) Biosimilars ----
      {
        name: 'Amjevita',
        type: 'BIOSIMILAR' as DrugType,
        costPerMonth: 1800,
        approvedForSwitch: true,
        therapeuticClass: 'TNF-Blocker',
        manufacturer: 'Amgen Inc.',
        description: 'First FDA-approved adalimumab biosimilar. Interchangeable with Humira.',
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
        description: 'First interchangeable adalimumab biosimilar approved by FDA.',
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
        description: 'Citrate-free adalimumab biosimilar with interchangeability designation.',
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
        description: 'Interchangeable adalimumab biosimilar from Sandoz.',
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
        description: 'High-concentration, citrate-free adalimumab biosimilar.',
        activeIngredient: 'adalimumab-aaty',
        fdaSuffix: '-aaty',
        blaNumber: 'BLA 761182',
        fdaApprovalDate: new Date('2023-03-01'),
        interchangeability: 'INTERCHANGEABLE' as InterchangeabilityStatus,
        referenceProductId: createdBrands['adalimumab'].id,
        indications: 'Rheumatoid Arthritis, Juvenile Idiopathic Arthritis, Psoriatic Arthritis, Ankylosing Spondylitis, Crohn\'s Disease, Ulcerative Colitis, Plaque Psoriasis',
        administrationRoute: 'Subcutaneous injection',
      },

      // ---- INFLIXIMAB (Remicade) Biosimilars ----
      {
        name: 'Inflectra',
        type: 'BIOSIMILAR' as DrugType,
        costPerMonth: 1400,
        approvedForSwitch: true,
        therapeuticClass: 'TNF-Blocker',
        manufacturer: 'Celltrion / Pfizer',
        description: 'First FDA-approved infliximab biosimilar.',
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
        description: 'Infliximab biosimilar approved for all reference indications.',
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

      // ---- TRASTUZUMAB (Herceptin) Biosimilars ----
      {
        name: 'Ogivri',
        type: 'BIOSIMILAR' as DrugType,
        costPerMonth: 1800,
        approvedForSwitch: true,
        therapeuticClass: 'HER2-Blocker',
        manufacturer: 'Mylan / Viatris',
        description: 'First FDA-approved trastuzumab biosimilar for HER2-positive cancers.',
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
        description: 'Trastuzumab biosimilar approved based on comprehensive comparative data.',
        activeIngredient: 'trastuzumab-anns',
        fdaSuffix: '-anns',
        blaNumber: 'BLA 761073',
        fdaApprovalDate: new Date('2019-06-13'),
        interchangeability: 'BIOSIMILAR' as InterchangeabilityStatus,
        referenceProductId: createdBrands['trastuzumab'].id,
        indications: 'HER2-Overexpressing Breast Cancer, HER2-Overexpressing Metastatic Gastric or Gastroesophageal Junction Adenocarcinoma',
        administrationRoute: 'Intravenous infusion',
      },

      // ---- FILGRASTIM (Neupogen) Biosimilars ----
      {
        name: 'Zarxio',
        type: 'BIOSIMILAR' as DrugType,
        costPerMonth: 1200,
        approvedForSwitch: true,
        therapeuticClass: 'G-CSF',
        manufacturer: 'Sandoz Inc.',
        description: 'First FDA-approved biosimilar in the United States (March 2015).',
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
    ];

    // Create biosimilars
    const createdBiosimilars = [];
    for (const drug of biosimilars) {
      const result = await prisma.drug.create({ data: drug });
      createdBiosimilars.push(result);
    }

    const allDrugs = [...Object.values(createdBrands), ...createdBiosimilars];

    return {
      message: 'FDA Purple Book drugs seeded successfully',
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
