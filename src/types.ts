export type CompanyBrief = { name: string; url: string; country: string; sector: string };

type GenderType = { male: number | null; female: number | null };

export type CompanyFull = CompanyBrief & {
  ticker: string;
  exchange: string;
  genders: { general: GenderType; executives: GenderType; directors: GenderType };
};
