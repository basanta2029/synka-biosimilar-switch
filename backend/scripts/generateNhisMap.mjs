import { promises as fs } from 'fs';
import path from 'path';

const TARGET_RULES = [
  { ingredientKey: 'rituximab', aliases: ['rituximab'], defaultNotes: 'Matched to NHIS by generic ingredient.' },
  { ingredientKey: 'trastuzumab', aliases: ['trastuzumab'], defaultNotes: 'Matched to NHIS by generic ingredient.' },
  { ingredientKey: 'adalimumab', aliases: ['adalimumab'], defaultNotes: 'Matched to NHIS by generic ingredient.' },
  { ingredientKey: 'epoetin', aliases: ['epoetin', 'epoetin alfa', 'erythropoietin'], defaultNotes: 'Matched to NHIS by generic ingredient.' },
  { ingredientKey: 'ranibizumab', aliases: ['ranibizumab'], defaultNotes: 'Matched to NHIS by generic ingredient.' },
];

function normalizeText(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function parsePrice(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return undefined;
  const parsed = Number(value.replace(/,/g, '').trim());
  return Number.isFinite(parsed) ? parsed : undefined;
}

function selectBestPricing(rows) {
  if (!rows.length) return undefined;
  const sorted = [...rows].sort((a, b) => (parsePrice(a.priceGhs) ?? Number.MAX_VALUE) - (parsePrice(b.priceGhs) ?? Number.MAX_VALUE));
  const best = sorted[0];
  const bestPrice = parsePrice(best.priceGhs);
  if (bestPrice === undefined) return undefined;

  return {
    nhisCode: best.code || 'UNKNOWN_CODE',
    genericName: best.genericName,
    unitOfPricing: best.unitOfPricing || 'UNKNOWN_UNIT',
    priceGhs: bestPrice,
    levelOfPrescribing: best.levelOfPrescribing || 'UNKNOWN_LEVEL',
  };
}

async function main() {
  const projectRoot = path.resolve(process.cwd());
  const inputPath = path.join(projectRoot, 'src', 'data', 'nhis2025-medicines-extract.json');
  const outputPath = path.join(projectRoot, 'src', 'data', 'nhis2025-biosimilar-map.json');

  const inputRaw = await fs.readFile(inputPath, 'utf8');
  const rows = JSON.parse(inputRaw);

  if (!Array.isArray(rows)) {
    throw new Error('Input file must be a JSON array of NHIS medicine rows.');
  }

  const normalizedRows = rows
    .filter((row) => row && typeof row.genericName === 'string' && row.genericName.trim().length > 0)
    .map((row) => ({
      ...row,
      genericName: row.genericName.trim(),
      normalizedGeneric: normalizeText(row.genericName),
    }));

  const ingredients = {};

  for (const rule of TARGET_RULES) {
    const matched = normalizedRows.filter((row) =>
      rule.aliases.some((alias) => row.normalizedGeneric.includes(normalizeText(alias)))
    );

    if (!matched.length) {
      ingredients[rule.ingredientKey] = {
        verificationStatus: 'NOT_FOUND_IN_NHIS_2025',
        isListed: false,
        notes: 'Not found in current NHIS 2025 extract; keep as unverified candidate.',
      };
      continue;
    }

    const pricing = selectBestPricing(matched);
    ingredients[rule.ingredientKey] = {
      verificationStatus: pricing ? 'MATCHED_NHIS_2025' : 'NEEDS_MANUAL_REVIEW',
      isListed: true,
      notes: rule.defaultNotes,
      ...(pricing ? { pricing } : {}),
    };
  }

  const output = {
    sourceVersion: 'NHIS Medicines List 2025 Version 1.0',
    lastReviewedAt: new Date().toISOString().slice(0, 10),
    notes:
      'Generated from nhis2025-medicines-extract.json. Coverage should be validated against full NHIS sheet and Ghana FDA records before production use.',
    ingredients,
  };

  await fs.writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
  console.log(`NHIS biosimilar map generated at ${outputPath}`);
}

main().catch((error) => {
  console.error('Failed to generate NHIS biosimilar map:', error);
  process.exit(1);
});
