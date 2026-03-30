## Ghana Regulatory & NHIS References (Working Notes)

This file captures key references and concepts from Ghana regulatory and reimbursement documents that will be relevant when implementing production-ready logic for Synka in the Ghana context.

These notes are **not a substitute for the official documents**; they summarize what has been shared so far so we can design the app in a way that can align with Ghana FDA and NHIS requirements later.

---

### 1. Ghana FDA – Innovator Biological Products

**Source**: “GUIDELINE ON REGISTRATION OF INNOVATOR BIOLOGICAL PRODUCTS”, FDA/VBP/GDL‑01/03 (effective 5 Sept 2025).

- Defines the **data and dossier structure (CTD Modules 1–5)** for innovator biologics:
  - Administrative / legal information (Module 1).
  - Quality / CMC – chemistry, manufacturing, control (Module 3).
  - Non‑clinical (Module 4).
  - Clinical (Module 5).
- Establishes that **innovator biologics must demonstrate quality, safety, and efficacy** with:
  - Full quality characterization.
  - Non‑clinical studies (pharmacology, toxicology).
  - Clinical studies (PK/PD, efficacy, safety, immunogenicity).
- Emphasizes reliance and GMP:
  - Ghana FDA can use decisions/data from “well‑resourced NRAs” (US FDA, EMA, WHO, etc.) but retains final authority.
  - Requires GMP, CPP, CoA, stability data, PV/RMP, etc.

Implication for Synka:
- When we eventually reference **actual Ghana‑registered innovator biologics**, we need to assume their approval rests on this framework; our app should not conflict with label/indications those approvals define.

---

### 2. Ghana FDA – Biosimilar Products

**Source**: “GUIDELINE ON REGISTRATION OF BIOSIMILAR PRODUCTS”, FDA/VBP/GDL‑02/03 (effective 5 Sept 2025).

- Defines **biosimilar / similar biological medicinal product**:
  - Must be “highly similar” to a Ghana‑registered reference product in quality, safety, and efficacy.
  - Cannot be treated like simple generics; requires **comparability** at multiple levels.
- Core requirements:
  - Extensive **analytical comparability** (structure, function, impurities).
  - Targeted **non‑clinical** studies where needed.
  - **Clinical PK/PD and at least one clinical immunogenicity study**; additional efficacy/safety studies as needed.
- Interchangeability:
  - Approval as biosimilar **does not automatically imply substitution**; prescriber decision is required.
- Post‑market:
  - Strong pharmacovigilance/RMP expectations; traceability by brand, batch, etc.

Implication for Synka:
- Our **eligibility logic and switch recommendations must not assume automatic substitution**; any app UX should make clear that switching is a prescriber decision, consistent with Ghana FDA.
- Any mapping of “brand → biosimilar options” needs to be backed by **real Ghana‑registered product data**, not demo assumptions.

---

### 3. Ghana FDA – Variations to Registered Biological Products

**Source**: “GUIDELINES FOR REPORTING VARIATIONS TO A REGISTERED BIOLOGICAL PRODUCT”, FDA/VBP/GDL‑07/02 (effective 8 Jan 2024).

- Defines **post‑approval changes** (variations) for biological products:
  - **Major (M)** vs **Minor (N)** variations, with examples and required data.
  - Covers CMC (manufacturing site, process, specs, stability, container/closure) and **safety/efficacy / label changes**:
    - New indications, new routes, dose changes, regimen changes, risk‑management changes, etc.
- Requires:
  - Pre‑approval of major variations before implementation.
  - Stability and comparability data for many quality changes.
  - Non‑clinical/clinical data where a change affects clinical use.

Implication for Synka:
- If Synka ever needs to reflect **label changes, new indications, or dosing changes** for a biologic, we should expect they went through this variation process, and our app must be able to update safely when product labelling changes.

---

### 4. NHIS Medicines List 2025 (Ghana)

**Source**: “NHIS Medicines List 2025 – Version 1.0” (effective 1 March 2025).

- National Health Insurance Scheme (NHIS) **formulary + price list**:
  - Lists medicines by **generic / INN**, dosage form, strength.
  - Provides **NHIS price per unit** (tablet, mL, ampoule, course, etc.).
  - Specifies **Level of Prescribing** for each item:
    - A – CHPS.
    - M – Midwifery.
    - B1 – Health Centre without doctor.
    - B2 – Health Centre with doctor.
    - C – District hospital.
    - D – Secondary/Tertiary hospital.
    - SM – Specialist medicines (restricted use).
- Methodology:
  - WHO/HAI pricing survey.
  - Uses generics where possible; brands only where still under patent.

Implication for Synka:
- This is an authoritative source for:
  - **What is reimbursable under NHIS and at what price**.
  - **Which facility levels can prescribe which drugs**.
- For production:
  - We should **not hardcode demo prices**; instead, we can design drug and pricing models so they can be driven off an NHIS‑style formulary.
  - For any Ghana deployment, our “available treatments” and cost/savings calculations should be anchored to **actual NHIS entries and prices**, not arbitrary values.

---

### 5. What these documents do *not* yet give us

These references are essential but **do not directly provide**:

- A Ghana‑specific **diagnosis vocabulary** for conditions treated by biologics (e.g., RA, Crohn’s), or a mapping from diagnoses to allowed drugs.
- A Ghana‑specific **allergy code system** or official list of biologic‑related contraindications at patient level.
- A machine‑readable list of **which specific biologic brands and biosimilars are registered in Ghana**, and how they pair (reference vs biosimilar).
- Ghana‑FDA encoded **patient‑level switch eligibility rules** (e.g., clinical decision rules that combine diagnosis, drug history, allergy, and other risk factors).

Implication for Synka:
- Our current demo data for:
  - `DIAGNOSES` and `ALLERGIES` constants on mobile.
  - Seeded biologic drugs and `costPerMonth` values in the backend.
  - Switch eligibility heuristics.
  are **US/EMA‑style examples**, **not** Ghana‑specific or regulator‑approved.
- Before any production use in Ghana, we will need:
  - A curated, Ghana‑appropriate **diagnosis and allergy set** from clinical partners.
  - A vetted list of **Ghana‑registered innovator + biosimilar products** and their NHIS coverage.
  - Ghana‑appropriate **cost/pricing data**, ideally from NHIS or clinic partners.
  - Clinical governance to define **explicit rules or guardrails** for when the app may suggest or document a switch.

---

### 6. Design Principles for the App (Ghana Context)

Based on these documents, when we refactor Synka toward a Ghana‑real deployment, we should:

1. **Separate demo content from Ghana‑specific content**:
   - Keep the app architecture but load diagnoses, allergies, drugs, and costs from configurable, data‑driven sources (e.g., JSON/tables seeded from Ghana data).

2. **Be explicit about decision support vs decision making**:
   - The app can help **display options and record a clinical decision**, but not “auto‑switch” without a prescriber step, consistent with biosimilar guidance.

3. **Align with NHIS + Ghana FDA where possible**:
   - Use NHIS pricing and Levels of Prescribing for any cost savings or eligibility views.
   - Ensure any drug we present as switchable is **actually registered and reimbursable** in Ghana.

4. **Plan for label & indication changes**:
   - Model drugs and indications so label/indication updates (per variation guidance) can be updated centrally and flow through the app.

These notes should be kept up to date as we ingest more Ghana‑specific product lists, clinical protocols, or structured data files.

