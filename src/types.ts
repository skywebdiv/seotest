export interface WordPressSite {
  id: string;
  name: string;
  url: string;
  username?: string;
  appPassword?: string;
}

export interface WordPressPost {
  id: number;
  title: string;
  content: string;
  link: string;
}

export interface PlanArticle {
  id: string;
  title: string;
  keywords: string;
  synonyms: string;
  status: 'pending' | 'published' | 'error' | 'writing' | 'reviewing';
  wpPostId?: number;
  progress?: number; // 0 to 100
  seoLevel?: string; // e.g. "95%"
  generatedContent?: string;
  generatedSeoTitle?: string;
  generatedMetaDescription?: string;
}

export interface ContentPlan {
  id: string;
  month: string;
  siteId: string;
  articles: PlanArticle[];
  options: { 
    location?: { country: string; city: string };
    eeatFocus?: string[];
    tone?: string;
    audience?: string;
    goal?: string;
    includeTOC?: boolean;
    includeFAQ?: boolean;
    includeKeyTakeaways?: boolean;
    articleLength?: 'short' | 'medium' | 'long';
    semanticFocus?: boolean;
  };
}
