export type Bilingual = {
  en: string;
  th: string;
};

export type MetricCard = {
  value: string;
  label: Bilingual;
  footnote: Bilingual;
  isTarget: boolean;
};

export type Screenshot = {
  filename: string;
  alt: Bilingual;
  caption: Bilingual;
  stubbed: boolean;
  width?: number;
  height?: number;
};

export type SecurityItem = {
  key: string;
  title: Bilingual;
  detail: Bilingual;
};

export type Architecture = {
  caption: Bilingual;
};

export type CaseStudy = {
  hero: {
    title: Bilingual;
    subtitle: Bilingual;
  };
  problem: Bilingual;
  architecture: Architecture;
  metrics: MetricCard[];
  adminIntro: Bilingual;
  screenshots: Screenshot[];
  security: SecurityItem[];
  observability: Bilingual;
  workflow: Bilingual;
  cta: {
    heading: Bilingual;
    body: Bilingual;
    mailto: string;
    buttonLabel: Bilingual;
  };
};
