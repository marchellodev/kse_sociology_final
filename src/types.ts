export type CompanyBrief = { name: string; url: string; country: string; sector: string };

type GenderType = { male: number | null; female: number | null };

export type CompanyFull = CompanyBrief & {
  ticker: string;
  symbol: number;
  exchange: string;
  currency: string | undefined;
  prices: { close: number; time: number }[];
  genders: { general: GenderType; executives: GenderType; directors: GenderType };
};
