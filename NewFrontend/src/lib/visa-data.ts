export type CountryCode = "usa" | "canada" | "australia";

export interface CountryVisaInfo {
  code: CountryCode;
  name: string;
  flag: string;
  tagline: string;
  visaType: string;
  levels: Array<"UG" | "PG" | "PhD">;
  processingTime: string;
  visaFee: string;
  proofOfFunds: string;
  englishTest: string;
  workRights: string;
  postStudyWork: string;
  documents: string[];
  steps: Array<{ title: string; detail: string }>;
  highlights: string[];
}

export const COUNTRIES: CountryVisaInfo[] = [
  {
    code: "usa",
    name: "United States",
    flag: "🇺🇸",
    tagline: "Home to the Ivy League and Silicon Valley.",
    visaType: "F-1 Student Visa",
    levels: ["UG", "PG", "PhD"],
    processingTime: "3 – 5 weeks after DS-160 & interview",
    visaFee: "US $185 (MRV) + US $350 SEVIS I-901",
    proofOfFunds: "First-year tuition + living costs (~US $25k – $60k)",
    englishTest: "TOEFL iBT 80+ / IELTS 6.5+ / Duolingo 105+",
    workRights: "On-campus up to 20 hrs / week during term",
    postStudyWork: "OPT 12 months (36 for STEM)",
    documents: [
      "Valid passport (6+ months)",
      "Form I-20 from SEVP-approved school",
      "DS-160 confirmation page",
      "SEVIS fee receipt",
      "Bank statements & sponsor affidavit",
      "Academic transcripts & test scores",
    ],
    steps: [
      { title: "Get admission", detail: "Receive Form I-20 from a SEVP-certified U.S. university." },
      { title: "Pay SEVIS fee", detail: "Pay the I-901 SEVIS fee and keep the receipt." },
      { title: "File DS-160", detail: "Complete the online non-immigrant visa application." },
      { title: "Book interview", detail: "Schedule at the nearest U.S. Embassy or Consulate." },
      { title: "Attend & travel", detail: "Enter the U.S. up to 30 days before program start." },
    ],
    highlights: ["1,000+ ranked universities", "Optional Practical Training (OPT)", "Cutting-edge research funding"],
  },
  {
    code: "canada",
    name: "Canada",
    flag: "🇨🇦",
    tagline: "Affordable tuition and a clear route to permanent residency.",
    visaType: "Study Permit (with TRV / eTA)",
    levels: ["UG", "PG", "PhD"],
    processingTime: "4 – 12 weeks (SDS route can be under 20 days)",
    visaFee: "CAD $150 + biometrics CAD $85",
    proofOfFunds: "Tuition + CAD $20,635 living (CAD $10k GIC for SDS)",
    englishTest: "IELTS 6.0+ (SDS: 6.0 each band) / TOEFL 83+",
    workRights: "Up to 24 hrs / week off-campus during term",
    postStudyWork: "PGWP up to 3 years",
    documents: [
      "Valid passport",
      "Letter of Acceptance from a DLI",
      "Proof of funds / GIC",
      "Statement of Purpose",
      "Medical exam & biometrics",
      "Provincial Attestation Letter (PAL)",
    ],
    steps: [
      { title: "Get LOA", detail: "Secure admission from a Designated Learning Institution." },
      { title: "Buy GIC", detail: "Purchase a Guaranteed Investment Certificate (SDS applicants)." },
      { title: "Apply online", detail: "Submit study permit via IRCC portal with all documents." },
      { title: "Biometrics & medical", detail: "Give biometrics at a VAC and complete panel medical." },
      { title: "Receive POE letter", detail: "Show it at the port of entry to activate your permit." },
    ],
    highlights: ["Lower tuition than USA / UK", "PGWP → PR pathway", "Bilingual, safe cities"],
  },
  {
    code: "australia",
    name: "Australia",
    flag: "🇦🇺",
    tagline: "World-class universities and a lifestyle that's hard to beat.",
    visaType: "Subclass 500 Student Visa",
    levels: ["UG", "PG", "PhD"],
    processingTime: "4 – 6 weeks (varies by assessment level)",
    visaFee: "AUD $1,600 (from July 2024)",
    proofOfFunds: "Tuition + AUD $29,710 living per year",
    englishTest: "IELTS 6.0+ / PTE 50+ / TOEFL iBT 64+",
    workRights: "48 hrs / fortnight during term, unlimited on breaks",
    postStudyWork: "Temporary Graduate Visa (485) 2 – 4 years",
    documents: [
      "Valid passport",
      "Confirmation of Enrolment (CoE)",
      "GTE statement",
      "Overseas Student Health Cover (OSHC)",
      "Financial capacity evidence",
      "English proficiency proof",
    ],
    steps: [
      { title: "Receive CoE", detail: "Accept your offer and get the Confirmation of Enrolment." },
      { title: "Arrange OSHC", detail: "Buy Overseas Student Health Cover for the visa duration." },
      { title: "Write GTE", detail: "Prepare a Genuine Temporary Entrant statement." },
      { title: "Lodge online", detail: "Submit via ImmiAccount with supporting documents." },
      { title: "Health & biometrics", detail: "Complete requested checks and await grant letter." },
    ],
    highlights: ["7 universities in the world's top 100", "Post-study work up to 4 years", "Vibrant multicultural cities"],
  },
];

export function getCountry(code: string): CountryVisaInfo | undefined {
  return COUNTRIES.find((c) => c.code === code);
}