/**
 * ============================================================================
 *  THE VISIT NOTE FORM LIVES HERE  —  this is the file you can edit yourself.
 * ============================================================================
 *
 *  Everything the nurse fills in on screen is generated from the list below.
 *  Add, remove, rename or reorder fields here and the form, the saved record
 *  and the admin read-only view all update together. No other file to touch.
 *
 *  A field looks like this:
 *
 *    { key: "heart_sounds", label: "Heart Sounds", suggestions: ["Normal"] }
 *
 *    key         a short unique id, lowercase_with_underscores. Once notes are
 *                saved, don't rename a key or old notes lose that answer.
 *    label       what the nurse sees.
 *    type        "text" (default) | "textarea" | "date" | "yesno"
 *    suggestions optional one-tap answers shown as buttons above the box.
 *    width       "full" makes the field span the whole row.
 *
 *  A section groups fields under a heading. `columns` is how many fields sit
 *  side by side on a large screen (1, 2 or 3).
 */

export type FieldType = "text" | "textarea" | "date" | "yesno";

export interface NoteField {
  key: string;
  label: string;
  type?: FieldType;
  suggestions?: string[];
  width?: "full";
  placeholder?: string;
}

export interface NoteSection {
  id: string;
  title: string;
  description?: string;
  columns?: 1 | 2 | 3;
  fields: NoteField[];
}

const WNL = ["WNL", "See comment"];
const DENIES = ["Denies", "Yes"];
const NA = ["N/A"];

export const visitNoteSections: NoteSection[] = [
  {
    id: "vitals",
    title: "Vital signs",
    columns: 3,
    fields: [
      { key: "bp", label: "BP", placeholder: "120/80" },
      { key: "ap_radial", label: "AP / Radial" },
      { key: "resp", label: "Resp" },
      { key: "wt", label: "Wt" },
      { key: "temp", label: "Temp" },
    ],
  },
  {
    id: "cardio_resp",
    title: "Cardiovascular & respiratory",
    description: "Mark all applicable. Complete description as necessary.",
    columns: 2,
    fields: [
      { key: "cardiovascular", label: "Cardiovascular", suggestions: WNL },
      { key: "respiratory", label: "Respiratory", suggestions: WNL },
      { key: "heart_sounds", label: "Heart sounds", suggestions: ["Normal", "Abnormal"] },
      { key: "chest_pain", label: "Chest pain / palpitations", suggestions: DENIES },
      { key: "peripheral_pulses", label: "Peripheral pulses", suggestions: ["Present", "Absent"] },
      {
        key: "edema",
        label: "Edema (location, depth, pitting vs. non-pitting)",
        suggestions: ["None"],
      },
      { key: "lung_sounds", label: "Lung sounds", suggestions: ["Clear", "Diminished", "Crackles"] },
      { key: "sob_doe_orthopnea", label: "SOB / DOE / Orthopnea", suggestions: DENIES },
      { key: "sputum", label: "Sputum – color / amount / cough", suggestions: ["No cough"] },
      {
        key: "oxygen",
        label: "Oxygen O2 (liters per minute, nasal cannula / vent mask)",
        suggestions: NA,
      },
      {
        key: "medications_reviewed",
        label: "Medications reviewed / changes / teaching side effects",
        suggestions: ["Yes", "No"],
      },
      {
        key: "pain",
        label: "Pain – intensity / location / character (1–10)",
        suggestions: ["None"],
      },
      { key: "wound_care", label: "Wound care (measurements once a week)", suggestions: NA },
      { key: "nebulizer", label: "Nebulizer treatments are", suggestions: NA },
    ],
  },
  {
    id: "neuromuscular",
    title: "Neuromuscular",
    columns: 2,
    fields: [
      { key: "nm_status", label: "Neuromuscular", suggestions: WNL },
      { key: "orientation", label: "Orientation", suggestions: ["Alert & oriented x3", "Alert & oriented x4"] },
      { key: "vertigo_headache", label: "Vertigo / headache", suggestions: DENIES },
      { key: "hand_grasp", label: "Hand grasp", suggestions: ["Equal", "Weak"] },
      { key: "numbness", label: "Numbness / tremors / tingling", suggestions: DENIES },
      { key: "seizures", label: "Seizures", suggestions: ["None"] },
      { key: "perla", label: "PERLA", suggestions: ["Yes", "No"] },
      { key: "balance_gait", label: "Balance / gait", suggestions: ["Steady", "Unsteady"] },
      { key: "assistive_device", label: "Cane / walker / wheelchair", suggestions: ["None", "Walker", "Wheelchair"] },
      { key: "recent_fall", label: "Recent fall / witnessed / etiology", suggestions: ["None"] },
    ],
  },
  {
    id: "genitourinary",
    title: "Genitourinary & endocrine",
    columns: 2,
    fields: [
      { key: "gu_status", label: "Genitourinary", suggestions: WNL },
      { key: "nocturia", label: "Nocturia", suggestions: DENIES },
      { key: "burning_frequency", label: "Burning / frequency / urgency", suggestions: DENIES },
      { key: "hematuria", label: "Hematuria", suggestions: DENIES },
      { key: "dysuria", label: "Dysuria", suggestions: DENIES },
      { key: "incontinence", label: "Incontinence", suggestions: ["Denies", "Yes, uses depends"] },
      { key: "urine_color", label: "Urine color / odor", suggestions: ["Clear yellow"] },
      { key: "foley_size", label: "Foley catheter size", suggestions: NA },
      { key: "foley_changed", label: "Foley date changed", type: "date" },
      { key: "gu_other", label: "Other" },
      { key: "hypoglycemia", label: "Endocrine – s/s hypoglycemia", suggestions: NA },
      { key: "blood_sugar", label: "Blood sugar", suggestions: NA },
      { key: "insulin_prefilled", label: "Insulin injections prefilled", suggestions: NA },
    ],
  },
  {
    id: "gastrointestinal",
    title: "Gastrointestinal",
    columns: 2,
    fields: [
      { key: "gi_status", label: "Gastrointestinal", suggestions: WNL },
      { key: "appetite", label: "Appetite", suggestions: ["Good", "Fair", "Poor"] },
      { key: "diet_complaint", label: "Diet complaint?", suggestions: ["None"] },
      { key: "dysphagia", label: "Dysphagia", suggestions: ["Denies", "Yes (baseline)"] },
      { key: "nausea_vomiting", label: "Nausea / vomiting", suggestions: DENIES },
      { key: "constipation_diarrhea", label: "Constipation / diarrhea", suggestions: DENIES },
      { key: "bowel_sounds", label: "Bowel sounds", suggestions: ["Present", "Absent"] },
      { key: "palpation_abdomen", label: "Palpation of abdomen", suggestions: ["Soft, non-tender"] },
      { key: "ostomy_type", label: "Ostomy / type", suggestions: NA },
      {
        key: "stoma_assistance",
        label: "Stoma – patient independent or needs assistance",
        suggestions: NA,
      },
      { key: "last_bowel_movement", label: "Date of recent bowel movement", type: "date" },
    ],
  },
  {
    id: "teaching",
    title: "Teaching / coordination of care",
    columns: 1,
    fields: [
      { key: "teaching", label: "Teaching / coordination of care", type: "textarea", width: "full" },
    ],
  },
];

/** The HHA / PCA supervision checklist rows (Yes / No / Comments). */
export const supervisionItems: { key: string; label: string }[] = [
  { key: "appearance_id", label: "Appearance / photo ID worn, adequate record keeping" },
  { key: "relationship", label: "Appropriate relationship with patient / family" },
  { key: "skills", label: "Appropriate skills" },
  { key: "environment", label: "Maintains clean, safe, comfortable environment" },
  { key: "communication", label: "Maintains appropriate communications, reports promptly" },
  { key: "plan_of_care", label: "Follows plan of care / universal precautions" },
  { key: "reviewed_poc", label: "Reviewed plan of care" },
  { key: "instructed_ojt", label: "Instructed / OJT provided" },
];

export const allFields: NoteField[] = visitNoteSections.flatMap((s) => s.fields);
