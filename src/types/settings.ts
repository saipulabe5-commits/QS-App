export interface AppSettings {
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  logoUrl?: string;
  defaultOverhead: number;
  defaultProfit: number;
  defaultTax: number;
  decimalDigits: number;
  documentNumberFormat: string;
}

export type CompanySettings = AppSettings;
