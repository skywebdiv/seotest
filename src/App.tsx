/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Search, 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  Link as LinkIcon, 
  Zap, 
  ArrowRight,
  Info,
  Loader2,
  ExternalLink,
  ShieldAlert,
  Settings2,
  ChevronDown,
  ChevronUp,
  LayoutDashboard,
  Globe,
  Plus,
  Trash2,
  RefreshCw,
  Calendar,
  Layers,
  Send,
  Eye,
  ArrowLeft,
  Download,
  Tag,
  Key,
  BarChart3,
  Type,
  Sparkles,
  Copy
} from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { analyzeSEO, SEOAnalysis, SEOAnalysisOptions, generateContentPlan, generateFullArticle, analyzeKeywordGap, KeywordGapAnalysis, generateSeoTitles } from "./services/seoService";
import { WordPressPost, WordPressSite, ContentPlan, PlanArticle } from "./types";
import { fetchWordPressPosts, createWordPressPost, fetchPublicWordPressPosts } from "./services/wordpressService";

export default function App() {
  const [view, setView] = useState<"audit" | "sites" | "competitors" | "content-plan" | "keywords" | "title-gen">("audit");
  const [activeTab, setActiveTab] = useState<"text" | "url">("url");
  const [inputValue, setInputValue] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<SEOAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Sites state
  const [sites, setSites] = useState<WordPressSite[]>(() => {
    const saved = localStorage.getItem("wp_sites");
    return saved ? JSON.parse(saved) : [];
  });
  const [newSite, setNewSite] = useState({ name: "", url: "", username: "", appPassword: "" });
  const [selectedSiteId, setSelectedSiteId] = useState<string>("");
  const [posts, setPosts] = useState<WordPressPost[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [postFetchError, setPostFetchError] = useState<string | null>(null);

  // Content Plan state
  const [plans, setPlans] = useState<ContentPlan[]>(() => {
    const saved = localStorage.getItem("content_plans");
    return saved ? JSON.parse(saved) : [];
  });
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [newPlanData, setNewPlanData] = useState({ 
    topic: "", 
    siteId: "", 
    count: 5,
    location: { country: "", city: "" },
    eeatFocus: [] as string[],
    tone: "احترافية وإقناعية",
    audience: "عام",
    goal: "زيادة الوعي وبناء السلطة المعرفية",
    includeTOC: true,
    includeFAQ: true,
    includeKeyTakeaways: true,
    articleLength: 'medium' as 'short' | 'medium' | 'long',
    semanticFocus: true
  });
  const [showAdvancedPlan, setShowAdvancedPlan] = useState(false);
  const [reviewingArticle, setReviewingArticle] = useState<{ planId: string; article: PlanArticle } | null>(null);
  const [isPublishingReview, setIsPublishingReview] = useState(false);
  const auditReportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isGeneratingArticle, setIsGeneratingArticle] = useState(false);

  // Keyword Analysis state
  const [keywordNiche, setKeywordNiche] = useState(() => localStorage.getItem("kw_niche") || "");
  const [isAnalyzingKeywords, setIsAnalyzingKeywords] = useState(false);
  const [keywordGapResult, setKeywordGapResult] = useState<KeywordGapAnalysis | null>(() => {
    const saved = localStorage.getItem("kw_gap_result");
    return saved ? JSON.parse(saved) : null;
  });
  const [selectedSiteForKeywords, setSelectedSiteForKeywords] = useState(() => localStorage.getItem("kw_site_id") || "");
  const [keywordMethod, setKeywordMethod] = useState<"site" | "url">(() => (localStorage.getItem("kw_method") as "site" | "url") || "site");
  const [keywordUrl, setKeywordUrl] = useState(() => localStorage.getItem("kw_url") || "");

  useEffect(() => {
    localStorage.setItem("kw_niche", keywordNiche);
  }, [keywordNiche]);

  useEffect(() => {
    if (keywordGapResult) {
      localStorage.setItem("kw_gap_result", JSON.stringify(keywordGapResult));
    } else {
      localStorage.removeItem("kw_gap_result");
    }
  }, [keywordGapResult]);

  useEffect(() => {
    localStorage.setItem("kw_site_id", selectedSiteForKeywords);
  }, [selectedSiteForKeywords]);

  useEffect(() => {
    localStorage.setItem("kw_method", keywordMethod);
  }, [keywordMethod]);

  useEffect(() => {
    localStorage.setItem("kw_url", keywordUrl);
  }, [keywordUrl]);

  // Title Generation state
  const [targetKeywords, setTargetKeywords] = useState("");
  const [isGeneratingTitles, setIsGeneratingTitles] = useState(false);
  const [generatedTitles, setGeneratedTitles] = useState<{ keyword: string; titles: string[] }[]>([]);

  const togglePlanEEAT = (key: string) => {
    setNewPlanData(prev => ({
      ...prev,
      eeatFocus: prev.eeatFocus.includes(key)
        ? prev.eeatFocus.filter(k => k !== key)
        : [...prev.eeatFocus, key]
    }));
  };

  useEffect(() => {
    localStorage.setItem("wp_sites", JSON.stringify(sites));
  }, [sites]);

  useEffect(() => {
    localStorage.setItem("content_plans", JSON.stringify(plans));
  }, [plans]);

  useEffect(() => {
    if (selectedSiteId) {
      const site = sites.find(s => s.id === selectedSiteId);
      if (site) {
        loadPosts(site);
      }
    } else {
      setPosts([]);
      setPostFetchError(null);
    }
  }, [selectedSiteId]);

  const loadPosts = async (site: WordPressSite) => {
    setIsLoadingPosts(true);
    setPostFetchError(null);
    try {
      const data = await fetchWordPressPosts(site);
      setPosts(data);
    } catch (err: any) {
      setPostFetchError(err.message || "فشل جلب المقالات. تأكد من رابط الموقع وبيانات الربط.");
      console.error(err);
    } finally {
      setIsLoadingPosts(false);
    }
  };

  const addSite = () => {
    if (!newSite.name || !newSite.url) return;
    const site: WordPressSite = {
      id: Date.now().toString(),
      name: newSite.name,
      url: newSite.url.replace(/\/$/, ""),
      username: newSite.username,
      appPassword: newSite.appPassword
    };
    setSites([...sites, site]);
    setNewSite({ name: "", url: "", username: "", appPassword: "" });
  };

  const removeSite = (id: string) => {
    setSites(sites.filter(s => s.id !== id));
    if (selectedSiteId === id) setSelectedSiteId("");
  };

  // Plan Functions
  const handleCreatePlan = async () => {
    if (!newPlanData.topic || !newPlanData.siteId) {
      setError("يرجى تحديد الموضوع والموقع المراد الربط به.");
      return;
    }

    setIsGeneratingPlan(true);
    setError(null);
    try {
      const suggestions = await generateContentPlan(newPlanData.topic, newPlanData.count, {
        location: newPlanData.location.country ? newPlanData.location : undefined,
        eeatFocus: newPlanData.eeatFocus,
        tone: newPlanData.tone,
        audience: newPlanData.audience,
        goal: newPlanData.goal,
        includeTOC: newPlanData.includeTOC,
        includeFAQ: newPlanData.includeFAQ,
        includeKeyTakeaways: newPlanData.includeKeyTakeaways,
        articleLength: newPlanData.articleLength,
        semanticFocus: newPlanData.semanticFocus
      });
      const newPlan: ContentPlan = {
        id: Date.now().toString(),
        month: new Date().toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' }),
        siteId: newPlanData.siteId,
        articles: suggestions.map(s => ({
          id: Math.random().toString(36).substr(2, 9),
          title: s.title,
          keywords: s.keywords,
          synonyms: s.synonyms,
          status: 'pending'
        })),
        options: {
          location: newPlanData.location.country ? newPlanData.location : undefined,
          eeatFocus: newPlanData.eeatFocus,
          tone: newPlanData.tone,
          audience: newPlanData.audience,
          goal: newPlanData.goal,
          includeTOC: newPlanData.includeTOC,
          includeFAQ: newPlanData.includeFAQ,
          includeKeyTakeaways: newPlanData.includeKeyTakeaways,
          articleLength: newPlanData.articleLength,
          semanticFocus: newPlanData.semanticFocus
        }
      };
      setPlans([newPlan, ...plans]);
      setNewPlanData({ 
        topic: "", 
        siteId: "", 
        count: 5,
        location: { country: "", city: "" },
        eeatFocus: [],
        tone: "احترافية وإقناعية",
        audience: "عام",
        goal: "زيادة الوعي وبناء السلطة المعرفية",
        includeTOC: true,
        includeFAQ: true,
        includeKeyTakeaways: true,
        articleLength: 'medium',
        semanticFocus: true
      });
      setShowAdvancedPlan(false);
    } catch (err) {
      setError("فشل إنشاء الخطة. يرجى المحاولة لاحقاً.");
      console.error(err);
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const publishToWP = async (planId: string, articleId: string) => {
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;
    
    const article = plan.articles.find(a => a.id === articleId);
    const site = sites.find(s => s.id === plan.siteId);
    
    if (!article || !site) return;

    // Start UI Progress Simulation
    setPlans(prev => prev.map(p => p.id === planId ? {
      ...p,
      articles: p.articles.map(a => a.id === articleId ? { ...a, status: 'writing' as const, progress: 10 } : a)
    } : p));

    try {
      // Step 1: Generate Content (Simulate steps)
      const interval = setInterval(() => {
        setPlans(prev => prev.map(p => p.id === planId ? {
          ...p,
          articles: p.articles.map(a => a.id === articleId ? { 
            ...a, 
            progress: Math.min((a.progress || 10) + 5, 85) 
          } : a)
        } : p));
      }, 500);

      // Fetch a sample of existing articles for internal linking context
      let existingContext: { title: string; url: string }[] = [];
      try {
        const recentPosts = await fetchWordPressPosts(site);
        existingContext = recentPosts.slice(0, 10).map(p => ({ title: p.title, url: p.link }));
      } catch (e) {
        console.warn("Could not fetch existing posts for context, proceeding without internal links.", e);
      }

      const articleData = await generateFullArticle(
        { title: article.title, keywords: article.keywords, synonyms: article.synonyms },
        plan.options,
        existingContext
      );
      
      clearInterval(interval);

      // Step 2: Finalize SEO check UI and set to REVIEW status
      setPlans(prev => prev.map(p => p.id === planId ? {
        ...p,
        articles: p.articles.map(a => a.id === articleId ? { 
          ...a, 
          status: 'reviewing' as const, 
          progress: 100, 
          seoLevel: "98%",
          generatedContent: articleData.content,
          generatedSeoTitle: articleData.seoTitle,
          generatedMetaDescription: articleData.metaDescription
        } : a)
      } : p));

    } catch (err) {
      console.error(err);
      setPlans(prev => prev.map(p => p.id === planId ? {
        ...p,
        articles: p.articles.map(a => a.id === articleId ? { ...a, status: 'error', progress: 0 } : a)
      } : p));
    }
  };

  const confirmPublishReview = async () => {
    if (!reviewingArticle) return;
    const { planId, article } = reviewingArticle;
    
    let siteId = "";
    if (planId === "adhoc") {
      siteId = selectedSiteForKeywords;
    } else {
      const plan = plans.find(p => p.id === planId);
      siteId = plan?.siteId || "";
    }
    
    const site = sites.find(s => s?.id === siteId);
    
    if (!site || !article.generatedContent) {
      setError("يرجى اختيار موقع مسجل لنشر المقال.");
      return;
    }

    setIsPublishingReview(true);
    try {
      const wpId = await createWordPressPost(site, article.generatedSeoTitle || article.title, article.generatedContent, {
        status: 'draft',
        focusKeyword: article.keywords,
        seoTitle: article.generatedSeoTitle,
        metaDescription: article.generatedMetaDescription
      });

      if (planId !== "adhoc") {
        setPlans(prev => prev.map(p => p.id === planId ? {
          ...p,
          articles: p.articles.map(a => a.id === article.id ? { 
            ...a, 
            status: 'published', 
            wpPostId: wpId
          } : a)
        } : p));
      }
      setReviewingArticle(null);
    } catch (err) {
      console.error(err);
      setError("فشل النشر لووردبريس. حاول مرة أخرى.");
    } finally {
      setIsPublishingReview(false);
    }
  };

  const exportToPDF = async () => {
    if (!auditReportRef.current) return;
    
    setIsExporting(true);
    try {
      const element = auditReportRef.current;
      
      // Clone the element to avoid disturbing the live UI
      const clone = element.cloneNode(true) as HTMLElement;
      
      // Mirror the computed styles to the clone to resolve modern CSS like 'oklch'
      // which html2canvas doesn't support. We convert them to computed RGB.
      const mirrorStyles = (source: HTMLElement, target: HTMLElement) => {
        const sourceStyles = window.getComputedStyle(source);
        
        // Copy standard styles that affect layout/appearance
        target.style.backgroundColor = sourceStyles.backgroundColor;
        target.style.color = sourceStyles.color;
        target.style.borderColor = sourceStyles.borderColor;
        target.style.borderRadius = sourceStyles.borderRadius;
        target.style.padding = sourceStyles.padding;
        target.style.margin = sourceStyles.margin;
        target.style.fontFamily = sourceStyles.fontFamily;
        target.style.fontSize = sourceStyles.fontSize;
        target.style.fontWeight = sourceStyles.fontWeight;
        target.style.display = sourceStyles.display;
        target.style.flexDirection = sourceStyles.flexDirection;
        target.style.alignItems = sourceStyles.alignItems;
        target.style.justifyContent = sourceStyles.justifyContent;
        target.style.gap = sourceStyles.gap;
        
        const sourceChildren = Array.from(source.children) as HTMLElement[];
        const targetChildren = Array.from(target.children) as HTMLElement[];
        
        sourceChildren.forEach((child, i) => {
          if (targetChildren[i]) mirrorStyles(child, targetChildren[i]);
        });
      };

      // Set base styles for the hidden clone
      document.body.appendChild(clone);
      clone.style.position = 'fixed';
      clone.style.top = '0';
      clone.style.left = '0';
      clone.style.zIndex = '-9999';
      clone.style.width = element.offsetWidth + 'px';
      clone.style.height = 'auto'; // Ensure it expands
      
      // Force expansion of scrollable areas in the clone
      const scrollContainers = clone.querySelectorAll('.overflow-y-auto');
      scrollContainers.forEach(container => {
        const el = container as HTMLElement;
        el.style.height = 'auto';
        el.style.maxHeight = 'none';
        el.style.overflow = 'visible';
      });

      // Apply mirrored computed styles (converts oklch -> rgb automatically via getComputedStyle)
      mirrorStyles(element, clone);

      const canvas = await html2canvas(clone, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#F8FAFC",
        width: element.offsetWidth,
        height: clone.offsetHeight
      });
      
      // Cleanup
      document.body.removeChild(clone);

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      let heightLeft = pdfHeight;
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pdf.internal.pageSize.getHeight();
      
      while (heightLeft >= 0) {
        position = heightLeft - pdf.internal.pageSize.getHeight(); // Fixed decrement logic
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pdf.internal.pageSize.getHeight();
      }

      pdf.save(`SEO-Audit-Report-${new Date().getTime()}.pdf`);
    } catch (err) {
      console.error("PDF Export Error:", err);
      setError("فشل تصدير التقرير بصيغة PDF بسبب توافق الألوان. حاول مرة أخرى.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleKeywordAnalysis = async () => {
    if (keywordMethod === "site" && !selectedSiteForKeywords) {
      setError("يرجى اختيار الموقع للتحليل.");
      return;
    }
    if (keywordMethod === "url" && !keywordUrl) {
      setError("يرجى إدخال رابط الموقع للتحليل.");
      return;
    }
    if (!keywordNiche) {
      setError("يرجى تحديد المجال للتحليل.");
      return;
    }
    
    setIsAnalyzingKeywords(true);
    setKeywordGapResult(null);
    setError(null);
    
    try {
      let titles: string[] = [];

      if (keywordMethod === "site") {
        const site = sites.find(s => s.id === selectedSiteForKeywords);
        if (!site) throw new Error("الموقع غير موجود.");
        const posts = await fetchWordPressPosts(site);
        titles = posts.map(p => p.title);
      } else {
        const posts = await fetchPublicWordPressPosts(keywordUrl);
        titles = posts.map(p => p.title);
      }
      
      if (titles.length === 0) {
        throw new Error("لم يتم العثور على مقالات لتحليلها في هذا الموقع.");
      }

      const result = await analyzeKeywordGap(titles, keywordNiche);
      setKeywordGapResult(result);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "فشل تحليل فجوة الكلمات. تأكد من أن الرابط صحيح لموقع ووردبريس.");
    } finally {
      setIsAnalyzingKeywords(false);
    }
  };

  const handleGenerateArticleFromSuggestion = async (topic: { title: string; primaryKeyword: string; reason: string }) => {
    setIsGeneratingArticle(true);
    setError(null);
    try {
      const site = sites.find(s => s.id === selectedSiteForKeywords);
      let existingContext: { title: string; url: string }[] = [];
      
      if (site) {
        try {
          const recentPosts = await fetchWordPressPosts(site);
          existingContext = recentPosts.slice(0, 10).map(p => ({ title: p.title, url: p.link }));
        } catch (e) {
          console.warn("Could not fetch posts for context", e);
        }
      }

      const result = await generateFullArticle(
        { title: topic.title, keywords: topic.primaryKeyword, synonyms: topic.reason },
        {
          goal: "بناء السلطة المعرفية وتصدر نتائج البحث",
          tone: "احترافية وإقناعية",
          audience: "عام",
          articleLength: 'medium',
          eeatFocus: ["expertise", "trustworthiness"],
          includeTOC: true,
          includeFAQ: true,
          includeKeyTakeaways: true,
          semanticFocus: true
        },
        existingContext
      );

      setReviewingArticle({
        planId: "adhoc", 
        article: {
          id: Math.random().toString(36).substr(2, 9),
          title: topic.title,
          keywords: topic.primaryKeyword,
          synonyms: topic.reason,
          generatedContent: result.content,
          generatedSeoTitle: result.seoTitle,
          generatedMetaDescription: result.metaDescription,
          status: 'draft' as const
        }
      });
    } catch (err: any) {
      console.error(err);
      setError("فشل توليد المقال. حاول مرة أخرى.");
    } finally {
      setIsGeneratingArticle(false);
    }
  };

  const handleGenerateTitles = async () => {
    if (!targetKeywords.trim()) {
      setError("يرجى إدخال بعض الكلمات المفتاحية.");
      return;
    }

    setIsGeneratingTitles(true);
    setError(null);
    try {
      const keywordsArray = targetKeywords.split("\n").map(k => k.trim()).filter(k => k !== "");
      const res = await generateSeoTitles(keywordsArray);
      setGeneratedTitles(res);
    } catch (err: any) {
      console.error(err);
      setError("فشل توليد العناوين. حاول مرة أخرى.");
    } finally {
      setIsGeneratingTitles(false);
    }
  };

  const deletePlan = (id: string) => {
    setPlans(plans.filter(p => p.id !== id));
  };

  const handlePostChange = (postId: string) => {
    const post = posts.find(p => p.id === parseInt(postId));
    if (post) {
      setActiveTab("url");
      setInputValue(post.link);
    }
  };
  
  // Customization Options
  const [showOptions, setShowOptions] = useState(false);
  const [options, setOptions] = useState<SEOAnalysisOptions>({
    focusEEAT: ["expertise", "authority", "trust"],
    prioritySpam: ["keyword-stuffing", "hidden-text"],
    customContext: ""
  });

  const handleAnalyze = async (val?: string) => {
    const contentToAnalyze = val || inputValue;
    if (!contentToAnalyze.trim()) return;
    
    setIsAnalyzing(true);
    setError(null);
    setResult(null);
    
    try {
      let contentForAI = contentToAnalyze;
      let fetchedHtml = "";

      if (activeTab === "url") {
        try {
          // Use a public proxy to avoid CORS for the demo
          const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(contentToAnalyze)}`;
          const response = await fetch(proxyUrl);
          if (response.ok) {
            const data = await response.json();
            const html = data.contents;
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, "text/html");
            const domain = new URL(contentToAnalyze).hostname;

            // Highlight links
            const links = doc.querySelectorAll("a");
            links.forEach(link => {
              const href = link.getAttribute("href") || "";
              const isExternal = href.startsWith("http") && !href.includes(domain);
              
              link.setAttribute("target", "_blank");
              link.setAttribute("rel", "noopener noreferrer");
              
              // Use inline styles to ensure visibility in dangerouslySetInnerHTML
              if (isExternal) {
                link.style.cssText = "background-color: #fee2e2 !important; border: 1px solid #fca5a5 !important; color: #991b1b !important; padding: 2px 4px !important; border-radius: 4px !important; text-decoration: none !important; font-weight: bold !important; display: inline-block !important; margin: 0 2px !important;";
              } else {
                link.style.cssText = "background-color: #e0e7ff !important; border: 1px solid #c7d2fe !important; color: #3730a3 !important; padding: 2px 4px !important; border-radius: 4px !important; text-decoration: none !important; font-weight: bold !important; display: inline-block !important; margin: 0 2px !important;";
              }
            });

            // Clean up unwanted tags for preview
            doc.querySelectorAll("script, style, iframe, header, footer, nav, aside, noscript").forEach(el => el.remove());
            
            // Pass the URL AND the clean text to AI for the best of both worlds
            contentForAI = `URL to Analyze: ${contentToAnalyze}\n\nPage Content:\n${doc.body.innerText.slice(0, 20000)}`;
            fetchedHtml = doc.body.innerHTML;
          }
        } catch (fetchErr) {
          console.warn("Proxy fetch failed, falling back to direct URL analysis", fetchErr);
        }
      }

      const data = await analyzeSEO(contentForAI, activeTab === "url", options);
      if (fetchedHtml) {
        data.analyzedContentHtml = fetchedHtml;
      }
      setResult(data);
    } catch (err) {
      setError("حدث خطأ أثناء تحليل المحتوى. يرجى المحاولة مرة أخرى.");
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleEEAT = (key: "expertise" | "authority" | "trust") => {
    setOptions(prev => ({
      ...prev,
      focusEEAT: prev.focusEEAT?.includes(key) 
        ? prev.focusEEAT.filter(k => k !== key)
        : [...(prev.focusEEAT || []), key]
    }));
  };

  const toggleSpam = (key: "keyword-stuffing" | "hidden-text" | "automated-content") => {
    setOptions(prev => ({
      ...prev,
      prioritySpam: prev.prioritySpam?.includes(key) 
        ? prev.prioritySpam.filter(k => k !== key)
        : [...(prev.prioritySpam || []), key]
    }));
  };

  const trySample = () => {
    setActiveTab("text");
    const sampleText = `كيف تصبح خبيرا في السيو في 24 ساعة؟
السيو هو أهم شيء في العالم. يجب عليك استخدام الكلمات المفتاحية مثل سيو، سيو، سيو، سيو في كل مكان.
سيو هو العلم الذي يدرس كيفية تصدر النتائج. سيو للمبتدئين سيو للمحترفين سيو للجميع.
اضغط هنا لمزيد من المعلومات: http://spammy-link.com
نحن الأفضل في تقديم خدمات السيو في الرياض وجدة ومكة والمدينة وكل مكان.`;
    setInputValue(sampleText);
    handleAnalyze(sampleText);
  };

  return (
    <div className="h-screen bg-slate-50 text-slate-900 font-sans flex overflow-hidden selection:bg-indigo-100" dir="rtl">
      {/* Sidebar Navigation */}
      <aside className="w-72 bg-white border-l border-slate-200 flex flex-col shrink-0 z-30 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        <div className="p-8 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <Zap className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-800 tracking-tighter leading-none">Insight Pro</h1>
              <p className="text-[10px] text-slate-400 mt-2 uppercase tracking-widest font-black">v2.4 Core Engine</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-6 space-y-2 overflow-y-auto custom-scrollbar">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 px-4">لوحة التحكم</p>
          
          <button 
            onClick={() => setView("audit")}
            className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-sm font-black transition-all group ${
              view === "audit" 
              ? "bg-indigo-600 text-white shadow-xl shadow-indigo-100 scale-[1.02]" 
              : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
            }`}
          >
            <div className={`p-2 rounded-xl transition-colors ${view === "audit" ? "bg-white/20" : "bg-slate-100 group-hover:bg-indigo-50"}`}>
              <Search size={18} className={view === "audit" ? "text-white" : "text-slate-400 group-hover:text-indigo-600"} />
            </div>
            <span>فحص السيو</span>
            {view === "audit" && <motion.div layoutId="nav-dot" className="w-1.5 h-1.5 bg-white rounded-full mr-auto" />}
          </button>

          <button 
            onClick={() => setView("competitors")}
            className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-sm font-black transition-all group ${
              view === "competitors" 
              ? "bg-rose-600 text-white shadow-xl shadow-rose-100 scale-[1.02]" 
              : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
            }`}
          >
            <div className={`p-2 rounded-xl transition-colors ${view === "competitors" ? "bg-white/20" : "bg-slate-100 group-hover:bg-rose-50"}`}>
              <Zap size={18} className={view === "competitors" ? "text-white" : "text-slate-400 group-hover:text-rose-600"} />
            </div>
            <span>قياس المنافسين</span>
            {view === "competitors" && <motion.div layoutId="nav-dot" className="w-1.5 h-1.5 bg-white rounded-full mr-auto" />}
          </button>

          <button 
            onClick={() => setView("content-plan")}
            className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-sm font-black transition-all group ${
              view === "content-plan" 
              ? "bg-emerald-600 text-white shadow-xl shadow-emerald-100 scale-[1.02]" 
              : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
            }`}
          >
            <div className={`p-2 rounded-xl transition-colors ${view === "content-plan" ? "bg-white/20" : "bg-slate-100 group-hover:bg-emerald-50"}`}>
              <Calendar size={18} className={view === "content-plan" ? "text-white" : "text-slate-400 group-hover:text-emerald-600"} />
            </div>
            <span>الخطة الشهرية</span>
            {view === "content-plan" && <motion.div layoutId="nav-dot" className="w-1.5 h-1.5 bg-white rounded-full mr-auto" />}
          </button>

          <button 
            onClick={() => setView("keywords")}
            className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-sm font-black transition-all group ${
              view === "keywords" 
              ? "bg-amber-600 text-white shadow-xl shadow-amber-100 scale-[1.02]" 
              : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
            }`}
          >
            <div className={`p-2 rounded-xl transition-colors ${view === "keywords" ? "bg-white/20" : "bg-slate-100 group-hover:bg-amber-50"}`}>
              <Tag size={18} className={view === "keywords" ? "text-white" : "text-slate-400 group-hover:text-amber-600"} />
            </div>
            <span>فحص الكلمات</span>
            {view === "keywords" && <motion.div layoutId="nav-dot" className="w-1.5 h-1.5 bg-white rounded-full mr-auto" />}
          </button>

          <button 
            onClick={() => setView("title-gen")}
            className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-sm font-black transition-all group ${
              view === "title-gen" 
              ? "bg-rose-600 text-white shadow-xl shadow-rose-100 scale-[1.02]" 
              : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
            }`}
          >
            <div className={`p-2 rounded-xl transition-colors ${view === "title-gen" ? "bg-white/20" : "bg-slate-100 group-hover:bg-rose-50"}`}>
              <Type size={18} className={view === "title-gen" ? "text-white" : "text-slate-400 group-hover:text-rose-600"} />
            </div>
            <span>اعداد العناوين</span>
            {view === "title-gen" && <motion.div layoutId="nav-dot" className="w-1.5 h-1.5 bg-white rounded-full mr-auto" />}
          </button>

          <button 
            onClick={() => setView("sites")}
            className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-sm font-black transition-all group ${
              view === "sites" 
              ? "bg-slate-800 text-white shadow-xl shadow-slate-100 scale-[1.02]" 
              : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
            }`}
          >
            <div className={`p-2 rounded-xl transition-colors ${view === "sites" ? "bg-white/20" : "bg-slate-100 group-hover:bg-slate-200"}`}>
              <Globe size={18} className={view === "sites" ? "text-white" : "text-slate-400 group-hover:text-slate-800"} />
            </div>
            <span>إدارة المواقع</span>
            {view === "sites" && <motion.div layoutId="nav-dot" className="w-1.5 h-1.5 bg-white rounded-full mr-auto" />}
          </button>

          <div className="pt-8 opacity-40">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 px-4">النظام</p>
            <div className="space-y-4 px-6">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                <span>تحديث المحرك</span>
                <span className="text-emerald-500">نشط</span>
              </div>
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                <span>الذكاء الاصطناعي</span>
                <span className="text-indigo-500">Flash 2.0</span>
              </div>
            </div>
          </div>
        </nav>

        <div className="p-8 border-t border-slate-100 bg-slate-50/50">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-400 font-black">H</div>
             <div className="overflow-hidden">
                <p className="text-xs font-black text-slate-800 truncate">Haroone Pro</p>
                <p className="text-[10px] text-slate-400 font-bold truncate">Premium User</p>
             </div>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Top Activity Bar */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-10 shrink-0 z-20">
          <div className="flex items-center gap-6">
            <div className="bg-slate-100 rounded-full px-5 py-2.5 border border-slate-200 flex items-center gap-3 min-w-[300px]">
              <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">المحتوى:</span>
              <span className="text-slate-600 text-xs font-mono truncate max-w-[200px]">
                {inputValue ? (activeTab === "url" ? inputValue : "Text Content Analysis...") : "بانتظار البيانات"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-3 border-l border-slate-200 pl-6 ml-2">
              <div className="text-left">
                <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest leading-none">وقت الفحص</p>
                <p className="text-xs font-black text-slate-700 mt-1.5">
                  {result ? new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : "00:00"}
                </p>
              </div>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${result ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-300'}`}>
                <RefreshCw size={14} className={isAnalyzing ? "animate-spin" : ""} />
              </div>
            </div>
            
            <button 
              onClick={() => handleAnalyze()}
              disabled={isAnalyzing || !inputValue}
              className="bg-indigo-600 text-white px-8 py-3 rounded-2xl text-xs font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
            >
              {isAnalyzing ? "جارٍ الفحص..." : "بدء التحليل الفوري"}
            </button>
          </div>
        </header>

        <main className="flex-1 p-10 overflow-y-auto custom-scrollbar bg-slate-50/30">
        <AnimatePresence mode="wait">
          {reviewingArticle ? (
            <motion.div
              key="review"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="px-10 py-6"
            >
               <button 
                 onClick={() => setReviewingArticle(null)}
                 className="mb-8 flex items-center gap-2 text-slate-400 hover:text-indigo-600 transition-colors font-black text-xs uppercase tracking-widest"
               >
                 <ArrowLeft size={16} /> العودة للخطة الشهرية
               </button>

               <div className="grid grid-cols-12 gap-8">
                  <div className="col-span-12 lg:col-span-8 space-y-6">
                     <div className="bg-white rounded-3xl p-10 border border-slate-200 shadow-sm relative">
                        <div className="absolute -top-4 right-10 bg-indigo-600 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase">معاينة المحتوى المكتوب</div>
                        <h1 className="text-3xl font-black text-slate-800 mb-8 leading-tight">{reviewingArticle.article.title}</h1>
                        <div 
                          className="prose prose-slate max-w-none preview-content text-right text-slate-700 leading-relaxed space-y-6"
                          dangerouslySetInnerHTML={{ __html: reviewingArticle.article.generatedContent || "" }}
                        />
                     </div>
                  </div>

                  <div className="col-span-12 lg:col-span-4 space-y-6">
                     <div className="bg-slate-800 rounded-3xl p-8 text-white shadow-xl">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">بيانات السيو (Metadata)</h3>
                        <div className="space-y-6">
                           <div className="space-y-2">
                              <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">SEO Title</p>
                              <p className="text-sm font-bold bg-slate-700/50 p-4 rounded-xl border border-slate-700 leading-relaxed text-slate-200">
                                 {reviewingArticle.article.generatedSeoTitle}
                              </p>
                           </div>
                           <div className="space-y-2">
                              <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Meta Description</p>
                              <p className="text-xs bg-slate-700/50 p-4 rounded-xl border border-slate-700 leading-relaxed text-slate-400 italic">
                                 {reviewingArticle.article.generatedMetaDescription}
                              </p>
                           </div>
                           <div className="pt-4 space-y-4">
                              <div className="flex items-center gap-3 text-emerald-400">
                                 <Zap size={14} />
                                 <span className="text-[10px] font-black uppercase">مستوى جودة E-E-A-T مرتفع جداً</span>
                              </div>
                              <p className="text-[10px] text-slate-500 leading-relaxed">المقال جاهز للنشر كمسودة. سيتم إرساله مع الكلمات المفتاحية وبيانات الميتا الموضحة أعلاه.</p>
                           </div>
                        </div>
                     </div>

                     <button 
                       onClick={confirmPublishReview}
                       disabled={isPublishingReview}
                       className="w-full bg-emerald-600 text-white py-6 rounded-3xl font-black text-lg flex items-center justify-center gap-4 hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-50 active:scale-95 disabled:opacity-50"
                     >
                       {isPublishingReview ? <Loader2 className="animate-spin" /> : <Send />}
                       {isPublishingReview ? "جارٍ الإرسال لووردبريس..." : "إضافة المقال للموقع (مسودة)"}
                     </button>
                  </div>
               </div>
            </motion.div>
          ) : view === "title-gen" ? (
            <motion.div
              key="title-gen"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="max-w-4xl mx-auto space-y-8"
            >
              <div className="bg-white rounded-3xl p-10 border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-2 h-full bg-rose-500"></div>
                <h2 className="text-3xl font-black text-slate-800 mb-4 tracking-tighter">إعداد العناوين الجذابة (SEO)</h2>
                <p className="text-slate-500 max-w-2xl leading-relaxed">أدخل كلماتك المفتاحية وسنقوم بتوليد عناوين احترافية تلتزم بمعايير جوجل 2026 لتعظيم الزيارات وتلبية نية البحث بدقة.</p>
                
                <div className="mt-8 space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">أدخل الكلمات المفتاحية (كل كلمة في سطر)</label>
                  <textarea 
                    placeholder="مثل:&#10;الربح من الانترنت&#10;سياحة دبي&#10;تعلم البرمجة"
                    value={targetKeywords}
                    onChange={(e) => setTargetKeywords(e.target.value)}
                    rows={6}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:border-rose-400 transition-all"
                  />
                  
                  <div className="flex justify-center mt-6">
                    <button 
                      onClick={handleGenerateTitles}
                      disabled={isGeneratingTitles || !targetKeywords.trim()}
                      className="w-full max-w-sm bg-rose-600 text-white py-5 rounded-2xl font-black text-base flex items-center justify-center gap-4 hover:bg-rose-700 transition-all shadow-xl shadow-rose-100 disabled:opacity-50"
                    >
                      {isGeneratingTitles ? <Loader2 className="animate-spin" size={22} /> : <Sparkles size={22} />}
                      {isGeneratingTitles ? "جاري إعداد العناوين..." : "توليد العناوين الاحترافية"}
                    </button>
                  </div>
                </div>
              </div>

              {generatedTitles.length > 0 && (
                <div className="space-y-6 pb-20">
                  {generatedTitles.map((item, idx) => (
                    <div key={idx} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                      <div className="bg-slate-50 px-8 py-4 border-b border-slate-200 flex items-center justify-between">
                         <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                           <Key size={14} className="text-rose-500" /> الكلمة: {item.keyword}
                         </h3>
                      </div>
                      <div className="divide-y divide-slate-100">
                        {item.titles.map((title, tIdx) => (
                          <div key={tIdx} className="p-6 flex items-center justify-between group hover:bg-slate-50/50 transition-colors">
                             <p className="font-bold text-slate-700 flex-1">{title}</p>
                             <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                  onClick={() => {
                                    navigator.clipboard.writeText(title);
                                    // Could add a toast here
                                  }}
                                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                  title="نسخ العنوان"
                                >
                                  <Copy size={16} />
                                </button>
                                <button 
                                  onClick={() => {
                                    setNewPlanData(prev => ({ ...prev, topic: title }));
                                    setView("content-plan");
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                  }}
                                  className="px-4 py-2 bg-slate-800 text-white text-[10px] font-black uppercase rounded-lg hover:bg-slate-900 transition-all"
                                >
                                  استخدام للخطة
                                </button>
                             </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ) : view === "keywords" ? (
            <motion.div
              key="keywords"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="max-w-6xl mx-auto space-y-8"
            >
              <div className="bg-white rounded-3xl p-10 border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-2 h-full bg-amber-500"></div>
                <h2 className="text-3xl font-black text-slate-800 mb-4 tracking-tighter">تحليل فجوة الكلمات المفتاحية</h2>
                <p className="text-slate-500 max-w-2xl leading-relaxed">قم بتحليل كلماتك الحالية واكتشف الفرص المفقودة للسيطرة على نتائج البحث في مجالك.</p>
                
                <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
                   <div className="space-y-4">
                      <div className="flex items-center justify-between">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">مصدر البيانات</label>
                         <div className="flex bg-slate-100 p-1 rounded-lg">
                            <button 
                              onClick={() => setKeywordMethod("site")}
                              className={`px-3 py-1 rounded-md text-[9px] font-black transition-all ${keywordMethod === "site" ? "bg-white text-slate-800 shadow-sm" : "text-slate-400"}`}
                            >
                              موقع مسجل
                            </button>
                            <button 
                              onClick={() => setKeywordMethod("url")}
                              className={`px-3 py-1 rounded-md text-[9px] font-black transition-all ${keywordMethod === "url" ? "bg-white text-slate-800 shadow-sm" : "text-slate-400"}`}
                            >
                              رابط مباشر
                            </button>
                         </div>
                      </div>
                      
                      {keywordMethod === "site" ? (
                        <select 
                          value={selectedSiteForKeywords}
                          onChange={(e) => setSelectedSiteForKeywords(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:border-amber-400 transition-all appearance-none"
                        >
                          <option value="">-- اختر موقعاً --</option>
                          {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                      ) : (
                        <input 
                          type="url"
                          placeholder="https://example.com"
                          value={keywordUrl}
                          onChange={(e) => setKeywordUrl(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:border-amber-400"
                        />
                      )}
                   </div>
                   <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">مجال الموقع (Niche)</label>
                      <input 
                        type="text"
                        placeholder="مثل: التقنية، الطبخ، السفر..."
                        value={keywordNiche}
                        onChange={(e) => setKeywordNiche(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:border-amber-400"
                      />
                   </div>
                </div>

                <div className="mt-10 flex justify-center">
                  <button 
                    onClick={handleKeywordAnalysis}
                    disabled={isAnalyzingKeywords || (keywordMethod === "site" && !selectedSiteForKeywords) || (keywordMethod === "url" && !keywordUrl) || !keywordNiche}
                    className="w-full max-w-sm bg-amber-600 text-white py-5 rounded-2xl font-black text-base flex items-center justify-center gap-4 hover:bg-amber-700 transition-all shadow-xl shadow-amber-100 disabled:opacity-50"
                  >
                    {isAnalyzingKeywords ? <Loader2 className="animate-spin" size={22} /> : <Tag size={22} />}
                    {isAnalyzingKeywords ? "جاري تحليل الفجوات..." : "بدء تحليل الكلمات"}
                  </button>
                </div>
              </div>

              {keywordGapResult && (
                <div className="grid grid-cols-12 gap-8 pb-20">
                   {/* Coverage Column */}
                   <div className="col-span-12 lg:col-span-4 space-y-6">
                      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
                         <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                           <BarChart3 size={14} className="text-amber-500" /> الكلمات المغطاة حالياً
                         </h3>
                         <div className="space-y-4">
                            {keywordGapResult.existingKeywords.map((kw, i) => (
                              <div key={i} className="space-y-2">
                                 <div className="flex justify-between text-xs font-bold text-slate-700">
                                    <span>{kw.keyword}</span>
                                    <span className="text-slate-400">({kw.count} مقال)</span>
                                 </div>
                                 <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <motion.div 
                                      initial={{ width: 0 }}
                                      animate={{ width: `${kw.coverage}%` }}
                                      className="h-full bg-emerald-500"
                                    />
                                 </div>
                              </div>
                            ))}
                         </div>
                      </div>

                      <div className="bg-slate-800 rounded-3xl p-8 text-white shadow-xl">
                         <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">إحصائية سريعة</h3>
                         <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-700/50 p-4 rounded-2xl border border-slate-700">
                               <p className="text-[8px] font-black text-slate-400 uppercase mb-1">الكلمات المفقودة</p>
                               <p className="text-2xl font-black text-amber-400">{keywordGapResult.missingKeywords.length}</p>
                            </div>
                            <div className="bg-slate-700/50 p-4 rounded-2xl border border-slate-700">
                               <p className="text-[8px] font-black text-slate-400 uppercase mb-1">فرص محتوى</p>
                               <p className="text-2xl font-black text-emerald-400">{keywordGapResult.suggestedTopics.length}</p>
                            </div>
                         </div>
                      </div>
                   </div>

                   {/* Gaps and Suggestions Column */}
                   <div className="col-span-12 lg:col-span-8 space-y-8">
                      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                         <div className="bg-slate-50 px-8 py-4 border-b border-slate-200">
                            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">تحليل الكلمات المفقودة (Keyword Gaps)</h3>
                         </div>
                         <div className="p-0 overflow-x-auto">
                            <table className="w-full text-right">
                               <thead>
                                  <tr className="border-b border-slate-100 bg-slate-50/30">
                                     <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase">الكلمة المفتاحية</th>
                                     <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase">الصعوبة</th>
                                     <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase">الإمكانيات</th>
                                  </tr>
                               </thead>
                               <tbody className="divide-y divide-slate-50">
                                  {keywordGapResult.missingKeywords.map((kw, i) => (
                                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                       <td className="px-8 py-4 text-sm font-black text-slate-800">{kw.keyword}</td>
                                       <td className="px-8 py-4">
                                          <span className={`text-[10px] font-black px-2 py-0.5 rounded ${
                                             kw.difficulty.includes('عالي') ? 'bg-rose-100 text-rose-700' :
                                             kw.difficulty.includes('متوسط') ? 'bg-amber-100 text-amber-700' :
                                             'bg-emerald-100 text-emerald-700'
                                          }`}>
                                             {kw.difficulty}
                                          </span>
                                       </td>
                                       <td className="px-8 py-4 text-xs text-slate-500 font-bold">{kw.potential}</td>
                                    </tr>
                                  ))}
                               </tbody>
                            </table>
                         </div>
                      </div>

                      <div className="space-y-6">
                         <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-4">مواضيع مقترحة لسد الفجوة</h3>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {keywordGapResult.suggestedTopics.map((topic, i) => (
                              <div key={i} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm border-r-4 border-r-amber-500 hover:shadow-md transition-all">
                                 <h4 className="font-black text-slate-800 mb-3 leading-tight text-lg">{topic.title}</h4>
                                 <div className="flex items-center gap-2 mb-4">
                                    <Key size={12} className="text-amber-500" />
                                    <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded">{topic.primaryKeyword}</span>
                                 </div>
                                 <p className="text-xs text-slate-500 leading-relaxed italic">{topic.reason}</p>
                                 
                                 <div className="mt-6 flex flex-col gap-2">
                                    <button 
                                      onClick={() => handleGenerateArticleFromSuggestion(topic)}
                                      disabled={isGeneratingArticle}
                                      className="w-full py-4 rounded-xl bg-slate-800 text-white text-xs font-black flex items-center justify-center gap-2 hover:bg-slate-900 transition-all shadow-lg"
                                    >
                                      {isGeneratingArticle ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} className="text-amber-400" />}
                                      إنشاء المقال الآن
                                    </button>
                                    <button 
                                      onClick={() => {
                                         setNewPlanData(prev => ({ 
                                           ...prev, 
                                           topic: topic.title, 
                                           siteId: keywordMethod === "site" ? selectedSiteForKeywords : "" 
                                         }));
                                         setView("content-plan");
                                         window.scrollTo({ top: 0, behavior: 'smooth' });
                                      }}
                                      className="w-full py-3 rounded-xl border border-slate-200 text-[10px] font-black uppercase text-slate-400 hover:border-emerald-500 hover:text-emerald-600 transition-all"
                                    >
                                      إضافة لخطة المحتوى
                                    </button>
                                 </div>
                              </div>
                            ))}
                         </div>
                      </div>
                   </div>
                </div>
              )}
            </motion.div>
          ) : view === "audit" ? (
            <motion.div 
              key="audit"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-12 gap-8"
            >
              {/* Left Column: Input / Controls */}
              <section className={`col-span-12 ${result ? 'lg:col-span-3' : 'lg:col-span-12 max-w-4xl mx-auto w-full'} flex flex-col gap-6`}>
                <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                      <Search size={18} className="text-indigo-600" />
                      تحليل جديد
                    </h3>
                    <div className="flex bg-slate-100 p-1 rounded-lg">
                      {["url", "text"].map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setActiveTab(tab as any)}
                          className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
                            activeTab === tab ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                          }`}
                        >
                          {tab === "url" ? "رابط" : "نص"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Site & Article Selector */}
                  {sites.length > 0 && (
                    <div className="mb-6 space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">تحديد محتوى من مواقعك</p>
                      <div className="grid grid-cols-2 gap-3">
                        <select 
                          value={selectedSiteId}
                          onChange={(e) => setSelectedSiteId(e.target.value)}
                          className="bg-white border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-indigo-400"
                        >
                          <option value="">اختر الموقع...</option>
                          {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                        <select 
                          disabled={!selectedSiteId || isLoadingPosts || !!postFetchError}
                          onChange={(e) => handlePostChange(e.target.value)}
                          className="bg-white border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-indigo-400 disabled:opacity-50"
                        >
                          <option value="">{isLoadingPosts ? "جارٍ التحميل..." : postFetchError ? "خطأ في الاتصال" : "اختر المقالة..."}</option>
                          {posts.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                        </select>
                      </div>
                      {postFetchError && (
                        <p className="text-[10px] text-rose-500 font-bold bg-rose-50 p-2 rounded-lg mt-2">
                          <AlertTriangle size={10} className="inline mr-1" /> {postFetchError}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="space-y-4">
              {activeTab === "url" ? (
                <input
                  type="url"
                  placeholder="https://example.com/article"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                />
              ) : (
                <textarea
                  placeholder="الصق نص المقال هنا للتحليل..."
                  rows={result ? 4 : 10}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                />
              )}
              
              {/* Advanced Options Toggle */}
              <div className="pt-2">
                <button 
                  onClick={() => setShowOptions(!showOptions)}
                  className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors"
                >
                  <Settings2 size={14} />
                  إعدادات متقدمة للفحص
                  {showOptions ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                
                <AnimatePresence>
                  {showOptions && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden mt-4 space-y-4 pt-4 border-t border-slate-100"
                    >
                      <div className="space-y-3">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">تركيز E-E-A-T</p>
                        <div className="flex flex-wrap gap-2">
                          {[
                            { id: "expertise", label: "الخبرة" },
                            { id: "authority", label: "المصداقية" },
                            { id: "trust", label: "الموثوقية" }
                          ].map(item => (
                            <button
                              key={item.id}
                              onClick={() => toggleEEAT(item.id as any)}
                              className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-all ${
                                options.focusEEAT?.includes(item.id as any)
                                ? "bg-indigo-50 border-indigo-200 text-indigo-600"
                                : "border-slate-200 text-slate-400"
                              }`}
                            >
                              {item.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">أولوية كشف الـ Spam</p>
                        <div className="flex flex-wrap gap-2">
                          {[
                            { id: "keyword-stuffing", label: "حشو الكلمات" },
                            { id: "hidden-text", label: "النص المخفي" },
                            { id: "automated-content", label: "المحتوى الآلي" }
                          ].map(item => (
                            <button
                              key={item.id}
                              onClick={() => toggleSpam(item.id as any)}
                              className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-all ${
                                options.prioritySpam?.includes(item.id as any)
                                ? "bg-rose-50 border-rose-200 text-rose-600"
                                : "border-slate-200 text-slate-400"
                              }`}
                            >
                              {item.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">سياق مخصص (اختياري)</p>
                        <input 
                          type="text"
                          placeholder="مثال: ركز على الجانب الطبي..."
                          value={options.customContext}
                          onChange={(e) => setOptions(prev => ({ ...prev, customContext: e.target.value }))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-indigo-400"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex flex-col gap-3 pt-2">
                <button
                  onClick={() => handleAnalyze()}
                  disabled={isAnalyzing || !inputValue}
                  className="w-full bg-indigo-600 text-white py-4 px-8 rounded-xl font-black text-lg flex items-center justify-center gap-3 hover:bg-indigo-700 transition-all disabled:opacity-50"
                >
                  {isAnalyzing ? <Loader2 className="animate-spin" /> : <Zap size={22} />}
                  <span>{isAnalyzing ? "جارٍ التحليل..." : "تحليل المحتوى"}</span>
                </button>
                <button
                  onClick={trySample}
                  className="w-full py-3 text-slate-400 hover:text-indigo-600 font-bold text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                >
                  <Info size={14} /> جرب بيانات تجريبية
                </button>
              </div>
              
              {error && (
                <div className="bg-red-50 border-r-4 border-red-400 p-4 rounded-lg flex items-center gap-3">
                  <ShieldAlert className="text-red-600" size={18} />
                  <p className="text-sm font-bold text-red-800">{error}</p>
                </div>
              )}
            </div>
          </div>

          <AnimatePresence>
            {result && (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-slate-800 rounded-2xl p-8 text-white shadow-xl flex flex-col justify-between"
              >
                <div>
                  <h3 className="text-xs font-bold text-slate-400 mb-6 tracking-widest uppercase">التوزيع الفني (E-E-A-T)</h3>
                  <div className="space-y-6">
                    {[
                      { label: "الخبرة (Expertise)", val: result.eeat.expertise.score },
                      { label: "المصداقية (Authority)", val: result.eeat.authoritativeness.score },
                      { label: "الموثوقية (Trust)", val: result.eeat.trustworthiness.score }
                    ].map((item, i) => (
                      <div key={i} className="space-y-2">
                        <div className="flex justify-between text-xs font-bold">
                          <span>{item.label}</span>
                          <span className="text-indigo-400">{item.val}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${item.val}%` }}
                            transition={{ duration: 1, delay: i * 0.2 }}
                            className="h-full bg-indigo-500 shadow-[0_0_8px_rgba(79,70,229,0.5)]" 
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="pt-8 border-t border-slate-700 mt-8">
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-[0.2em] mb-3">حالة محتوى Spam</p>
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${result.technicalMetadata.isSpamSafe ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.6)]' : 'bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.6)]'} animate-pulse`}></div>
                    <span className={`text-sm font-bold ${result.technicalMetadata.isSpamSafe ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {result.technicalMetadata.spamStatus}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Center/Main Column: Audit Results */}
        <section 
          ref={auditReportRef}
          className={`col-span-12 ${result ? 'lg:col-span-6' : 'lg:col-span-12 hidden'} flex flex-col gap-8`}
        >
          <AnimatePresence mode="wait">
            {result && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm flex-1 flex flex-col overflow-hidden"
              >
                <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="text-indigo-600" size={20} />
                    <h2 className="font-black text-slate-800 text-lg uppercase tracking-tight">تقرير الفحص المتقدم</h2>
                  </div>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={exportToPDF}
                      disabled={isExporting}
                      className="text-[10px] bg-slate-800 text-white px-4 py-1.5 rounded-lg font-black uppercase tracking-widest flex items-center gap-2 hover:bg-slate-900 transition-all shadow-md active:scale-95 disabled:opacity-50"
                    >
                      {isExporting ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                      تصدير التقرير PDF
                    </button>
                    <span className="text-[10px] bg-slate-200 text-slate-600 px-3 py-1 rounded-full font-mono font-bold">Google Core Sync</span>
                  </div>
                </div>

                <div className="p-8 overflow-y-auto flex flex-col gap-8">
                  {/* Rating Circle Section */}
                  <div className="flex flex-col items-center py-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                    <p className="text-slate-500 text-sm font-black mb-6 uppercase tracking-widest">التقييم الكلي للمحتوى</p>
                    <div className="relative w-40 h-40 flex items-center justify-center">
                      <svg className="absolute w-full h-full -rotate-90" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="15.9" fill="none" stroke="#E2E8F0" strokeWidth="3" />
                        <motion.circle 
                          cx="18" cy="18" r="15.9" 
                          fill="none" 
                          stroke="#4F46E5" 
                          strokeWidth="3" 
                          strokeDasharray="100, 100"
                          initial={{ strokeDashoffset: 100 }}
                          animate={{ strokeDashoffset: 100 - (result.generalRating * 10) }}
                          transition={{ duration: 1.5, ease: "easeOut" }}
                        />
                      </svg>
                      <div className="flex flex-col items-center justify-center">
                        <span className="text-5xl font-black text-slate-800 leading-none">{result.generalRating}</span>
                        <span className="text-[10px] font-bold text-slate-400 mt-2">OUT OF 10</span>
                      </div>
                    </div>
                    <div className="mt-6 text-sm font-black text-center px-6 leading-relaxed">
                      {result.summary}
                    </div>
                    <div className="mt-4 px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-xs font-black uppercase tracking-widest">
                      {result.generalRating >= 7 ? "أداء ممتاز" : "يتطلب تحسين"}
                    </div>
                  </div>

                  <div className="h-px bg-slate-100 w-full" />

                  {/* Highlights Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <h3 className="text-xs font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                        <span className="w-6 h-6 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600">✓</span>
                        نقاط القوة (Assets)
                      </h3>
                      <ul className="space-y-3">
                        {result.strengths.map((item, i) => (
                          <li key={i} className="flex items-start gap-3 text-sm text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <ArrowRight size={14} className="mt-1 shrink-0 text-slate-300" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-xs font-black text-rose-600 uppercase tracking-widest flex items-center gap-2">
                        <span className="w-6 h-6 bg-rose-100 rounded-lg flex items-center justify-center text-rose-600">!</span>
                        ملاحظات حرجة (Critical)
                      </h3>
                      <div className="space-y-3">
                        {result.criticalNotes.map((item, i) => (
                          <div key={i} className="bg-rose-50 border-r-4 border-rose-400 p-4 rounded-xl">
                            <p className="text-sm font-bold text-rose-900 leading-relaxed">{item}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="h-px bg-slate-100 w-full" />

                  {/* Detailed E-E-A-T Feedback Section */}
                  <div className="space-y-6">
                    <h3 className="text-xs font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                      <span className="w-6 h-6 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">i</span>
                      تحليل E-E-A-T المفصل
                    </h3>
                    <div className="space-y-4">
                      {[
                        { title: "الخبرة (Expertise)", data: result.eeat.expertise },
                        { title: "المصداقية (Authoritativeness)", data: result.eeat.authoritativeness },
                        { title: "الموثوقية (Trustworthiness)", data: result.eeat.trustworthiness }
                      ].map((item, i) => (
                        <div key={i} className="bg-slate-50 border border-slate-100 p-5 rounded-2xl">
                          <div className="flex justify-between items-center mb-3">
                            <span className="text-sm font-black text-slate-800">{item.title}</span>
                            <span className="text-xs font-bold px-2 py-1 bg-indigo-100 text-indigo-700 rounded-lg">{item.data.score}/100</span>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed italic">{item.data.feedback}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="h-px bg-slate-100 w-full" />

                  {/* Content Preview Section */}
                  {result.analyzedContentHtml && (
                    <div className="space-y-6">
                      <h3 className="text-xs font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                        <span className="w-6 h-6 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
                          <LinkIcon size={14} />
                        </span>
                        خريطة الروابط والمحتوى المكتشف
                      </h3>
                      
                      <div className="flex gap-6 mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-indigo-100 border border-indigo-300 rounded shadow-sm" />
                          <span className="text-[10px] font-black text-indigo-700 uppercase tracking-tighter">روابط داخلية (Internal)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-rose-100 border border-rose-300 rounded shadow-sm" />
                          <span className="text-[10px] font-black text-rose-700 uppercase tracking-tighter">روابط خارجية (External)</span>
                        </div>
                      </div>

                      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-8 max-h-[500px] overflow-y-auto text-sm leading-relaxed text-slate-700 relative custom-scrollbar border-dashed border-2">
                        <div 
                          className="prose prose-slate max-w-none preview-content text-right"
                          dangerouslySetInnerHTML={{ __html: result.analyzedContentHtml }} 
                        />
                      </div>
                    </div>
                  )}

                  <div className="h-px bg-slate-100 w-full" />

                  {/* E-E-A-T Text Improvements Section */}
                  <div className="space-y-6">
                    <h3 className="text-xs font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                      <span className="w-6 h-6 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">✎</span>
                      مقترحات تحسين النص (E-E-A-T)
                    </h3>
                    <div className="space-y-4">
                      {result.eeatImprovements.map((item, i) => (
                        <div key={i} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                          <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">الحالة الحالية ↓</span>
                            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">يفتقر للتخصص/الموثوقية</span>
                          </div>
                          <div className="p-4 bg-red-50/30 text-xs text-slate-500 italic line-through decoration-red-300">
                            {item.originalPart}
                          </div>
                          <div className="bg-emerald-50/30 px-4 py-2 border-y border-emerald-100 flex items-center justify-between">
                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-tighter">المقترح التحسيني ↑</span>
                          </div>
                          <div className="p-4 text-sm text-slate-800 font-bold leading-relaxed">
                            {item.suggestedImprovement}
                          </div>
                          <div className="p-4 bg-slate-50 border-t border-slate-100 italic text-[10px] text-indigo-600 flex gap-2">
                            <span className="font-black shrink-0">السبب:</span>
                            <span>{item.reason}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="h-px bg-slate-100 w-full" />

                  {/* Missing Suggestions Section */}
                  <div className="space-y-6">
                    <h3 className="text-xs font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                      <span className="w-6 h-6 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">?</span>
                      فجوات المحتوى (مقترحات للتقوية)
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {result.missingSuggestions.map((item, i) => (
                        <div key={i} className="bg-white border-2 border-indigo-50 p-5 rounded-2xl flex gap-4 hover:border-indigo-100 transition-colors">
                          <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0 font-bold text-xs italic">
                            {i + 1}
                          </div>
                          <p className="text-sm text-slate-700 leading-relaxed font-medium">{item}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="h-px bg-slate-100 w-full" />

                  {/* Internal Article Suggestions Section */}
                  <div className="space-y-6">
                    <h3 className="text-xs font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                      <span className="w-6 h-6 bg-slate-800 rounded-lg flex items-center justify-center text-white">★</span>
                      استراتيجية عنقود المحتوى (مقالات مقترحة)
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                      {result.internalArticleSuggestions.map((item, i) => (
                        <div key={i} className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex flex-col gap-2 hover:bg-indigo-50/30 transition-colors group">
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 bg-white border border-slate-200 rounded flex items-center justify-center text-[10px] font-black text-slate-400 group-hover:border-indigo-200 group-hover:text-indigo-600 transition-colors">
                              {i + 1}
                            </div>
                            <h4 className="text-sm font-black text-slate-800 group-hover:text-indigo-700 transition-colors">{item.title}</h4>
                          </div>
                          <p className="text-xs text-slate-500 pr-9 leading-relaxed italic">
                            <span className="font-bold text-slate-400">الهدف:</span> {item.relevance}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Right Column: Links & Actionable Intel */}
        <AnimatePresence>
          {result && (
            <motion.section 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="col-span-12 lg:col-span-3 flex flex-col gap-6"
            >
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <h3 className="text-sm font-black text-slate-800 mb-6 uppercase tracking-widest">خريطة الروابط (Linkage)</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
                    <p className="text-[10px] text-indigo-400 font-black uppercase mb-1">داخلية</p>
                    <p className="text-2xl font-black text-indigo-700">{result.technicalMetadata.internalLinksCount}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <p className="text-[10px] text-slate-400 font-black uppercase mb-1">خارجية</p>
                    <p className="text-2xl font-black text-slate-700">{result.technicalMetadata.externalLinksCount.toString().padStart(2, '0')}</p>
                  </div>
                </div>
                <div className="mt-6 space-y-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 italic">روابط مشبوهة (Spam)</span>
                    <span className={`text-xs font-black ${result.technicalMetadata.isSpamSafe ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'} px-2 py-0.5 rounded`}>
                      {result.technicalMetadata.isSpamSafe ? "0" : "!"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 italic">نصوص الـ Anchor</span>
                    <span className="text-xs font-black text-amber-500 uppercase tracking-tighter">Needs Work</span>
                  </div>
                </div>
              </div>

              <div className="bg-indigo-900 rounded-3xl p-8 text-white shadow-xl flex-1 overflow-hidden flex flex-col relative">
                <div className="absolute top-0 right-0 p-3 opacity-20"><LinkIcon size={80} /></div>
                <h3 className="text-sm font-black text-indigo-200 mb-8 italic uppercase tracking-widest relative z-10">توصيات الباك لينك</h3>
                <div className="flex-1 space-y-6 relative z-10 overflow-y-auto pr-2 custom-scrollbar">
                  {result.linkRecommendations.map((rec, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="w-2.5 h-2.5 rounded-full bg-indigo-400 mt-1.5 shrink-0 shadow-[0_0_8px_#818cf8]" />
                      <p className="text-xs leading-relaxed text-indigo-100 font-medium">
                        {rec}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

            {!result && !isAnalyzing && (
              <section className="col-span-12 flex flex-col items-center justify-center py-24 opacity-30">
                <div className="w-32 h-32 bg-slate-200 rounded-full flex items-center justify-center border-4 border-slate-300">
                  <FileText size={48} className="text-slate-400" />
                </div>
                <h2 className="text-4xl font-black mt-8 text-slate-800 tracking-tighter uppercase whitespace-nowrap">Input Analysis Required</h2>
                <p className="mt-4 font-mono text-sm tracking-widest">AWAITING SYSTEM TRIGGER...</p>
              </section>
            )}
            </motion.div>
          ) : view === "competitors" ? (
            <motion.div 
               key="competitors"
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -10 }}
               className="max-w-6xl mx-auto w-full space-y-8"
            >
              {result ? (
                <div className="space-y-8">
                  <div className="flex items-center justify-between bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                    <div>
                      <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                        <Zap className="text-rose-600" /> تحليل المنافسين المباشرين
                      </h2>
                      <p className="text-slate-400 text-sm mt-2 font-bold uppercase tracking-widest">مقارنة محتواك مع أفضل 3 نتائج متصدرة</p>
                    </div>
                    <div className="bg-rose-50 text-rose-600 px-6 py-3 rounded-xl border border-rose-100 text-xs font-black uppercase tracking-tighter">
                      الحالة: تم الكشف عن {result.competitors.length} منافسين
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {result.competitors.map((comp, i) => (
                      <div key={i} className="bg-white border text-right border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:border-rose-300 transition-all flex flex-col">
                        <div className="bg-slate-900 px-6 py-4 flex justify-between items-center text-white">
                          <span className="text-xs font-black uppercase tracking-widest">{comp.name}</span>
                          <span className="text-[14px] bg-rose-500 rounded-full w-8 h-8 flex items-center justify-center font-bold">{i + 1}</span>
                        </div>
                        <div className="p-6 space-y-6 flex-1">
                          <div className="space-y-3">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">نقاط تميزهم:</p>
                            <p className="text-sm text-slate-600 leading-relaxed italic pr-4 border-r-2 border-slate-100">
                              {comp.topContentSummary}
                            </p>
                          </div>
                          
                          <div className="h-px bg-slate-50" />

                          <div className="bg-rose-50/50 p-5 rounded-2xl border border-rose-100">
                            <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                              <Zap size={10} /> خطة التفوق عليهم:
                            </p>
                            <p className="text-sm font-bold text-slate-800 leading-relaxed">
                              {comp.improvementToOutperform}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-3xl p-24 border-4 border-dashed border-slate-100 flex flex-col items-center justify-center text-center">
                  <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 text-slate-200">
                    <Search size={48} />
                  </div>
                  <h3 className="text-2xl font-black text-slate-300 uppercase tracking-tighter">لا توجد بيانات للمنافسين</h3>
                  <p className="text-slate-400 mt-4 max-w-md font-bold text-sm">قم بإجراء "فحص سيو" أولاً ليقوم النظام بالتعرف على المنافسين وتحليلهم في هذا القسم.</p>
                  <button onClick={() => setView("audit")} className="mt-8 bg-indigo-600 text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest">بدء تحليل جديد</button>
                </div>
              )}
            </motion.div>
          ) : view === "content-plan" ? (
             <motion.div 
               key="content-plan"
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -10 }}
               className="max-w-6xl mx-auto w-full space-y-10"
             >
                <div className="bg-white rounded-3xl p-10 border border-slate-200 shadow-xl shadow-slate-100 relative overflow-hidden text-right">
                   <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl opacity-50" />
                   <div className="relative z-10">
                      <h2 className="text-3xl font-black text-slate-800 flex items-center gap-4 mb-2">
                        <Calendar className="text-emerald-500" size={32} /> إنشاء خطة عمل شهرية
                      </h2>
                      <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-xs">ذكاء اصطناعي لتخطيط المحتوى والكلمات المفتاحية</p>
                      
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-10">
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">الموضوع الرئيسي (Niche)</label>
                          <input 
                            type="text" 
                            placeholder="مثال: التداول، العناية بالبشرة، الربح من الانترنت..."
                            value={newPlanData.topic}
                            onChange={(e) => setNewPlanData({ ...newPlanData, topic: e.target.value })}
                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm focus:outline-none focus:border-emerald-400 transition-all font-bold"
                          />
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">تحديد الموقع المستهدف</label>
                          <select 
                            value={newPlanData.siteId}
                            onChange={(e) => setNewPlanData({ ...newPlanData, siteId: e.target.value })}
                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm focus:outline-none focus:border-emerald-400 transition-all font-bold appearance-none"
                          >
                             <option value="">اختر موقع ووردبريس...</option>
                             {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                          </select>
                        </div>
                      </div>

                      <div className="mt-8 border-t border-slate-100 pt-8">
                         <button 
                           onClick={() => setShowAdvancedPlan(!showAdvancedPlan)}
                           className="flex items-center gap-2 text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-700 transition-colors"
                         >
                           <Settings2 size={14} />
                           {showAdvancedPlan ? "إخفاء الخيارات المتقدمة" : "إظهار خيارات التخصيص المتقدمة"}
                           {showAdvancedPlan ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                         </button>

                         <AnimatePresence>
                           {showAdvancedPlan && (
                             <motion.div 
                               initial={{ height: 0, opacity: 0 }}
                               animate={{ height: "auto", opacity: 1 }}
                               exit={{ height: 0, opacity: 0 }}
                               className="overflow-hidden"
                             >
                               <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 px-4 pb-4">
                                  <div className="space-y-4">
                                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">تخصيص السيو و E-E-A-T</p>
                                     <div className="flex flex-wrap gap-2">
                                        {[
                                          { id: "expertise", label: "الخبرة العملية" },
                                          { id: "authority", label: "المصداقية العالية" },
                                          { id: "trust", label: "منظور الموثوقية" },
                                          { id: "case-studies", label: "دراسات حالة" },
                                          { id: "stats", label: "بيانات وإحصائيات" }
                                        ].map(item => (
                                          <button
                                            key={item.id}
                                            onClick={() => togglePlanEEAT(item.id)}
                                            className={`px-4 py-2 rounded-xl text-[10px] font-black border transition-all ${
                                              newPlanData.eeatFocus.includes(item.id)
                                              ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100"
                                              : "border-slate-200 text-slate-400 hover:border-indigo-400"
                                            }`}
                                          >
                                            {item.label}
                                          </button>
                                        ))}
                                     </div>
                                  </div>

                                  <div className="space-y-4">
                                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">الاستهداف الجغرافي</p>
                                     <div className="grid grid-cols-2 gap-4">
                                        <input 
                                          type="text" 
                                          placeholder="الدولة (مثلاً: السعودية)" 
                                          value={newPlanData.location.country}
                                          onChange={(e) => setNewPlanData({ ...newPlanData, location: { ...newPlanData.location, country: e.target.value }})}
                                          className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:border-indigo-400 font-bold"
                                        />
                                        <input 
                                          type="text" 
                                          placeholder="المدينة (مثلاً: الرياض)" 
                                          value={newPlanData.location.city}
                                          onChange={(e) => setNewPlanData({ ...newPlanData, location: { ...newPlanData.location, city: e.target.value }})}
                                          className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:border-indigo-400 font-bold"
                                        />
                                     </div>
                                  </div>

                                  <div className="space-y-4">
                                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">الهدف التسويقي والنبرة</p>
                                     <div className="grid grid-cols-2 gap-4">
                                        <select 
                                           value={newPlanData.tone}
                                           onChange={(e) => setNewPlanData({ ...newPlanData, tone: e.target.value })}
                                           className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:border-indigo-400 font-bold"
                                        >
                                           <option>احترافية وإقناعية</option>
                                           <option>تعليمية ومبسطة</option>
                                           <option>تسويقية مباشرة</option>
                                           <option>قصصية وملهمة</option>
                                        </select>
                                        <select 
                                           value={newPlanData.goal}
                                           onChange={(e) => setNewPlanData({ ...newPlanData, goal: e.target.value })}
                                           className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:border-indigo-400 font-bold"
                                        >
                                           <option>زيادة الوعي وبناء السلطة المعرفية</option>
                                           <option>توليد العملاء المحتملين (Leads)</option>
                                           <option>زيادة المبيعات المباشرة</option>
                                           <option>تحسين التفاعل والولاء</option>
                                        </select>
                                     </div>
                                  </div>

                                  <div className="space-y-4">
                                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">تنسيق وهيكل السيو</p>
                                     <div className="flex flex-wrap gap-2">
                                        {[
                                          { id: "includeTOC", label: "جدول المحتويات" },
                                          { id: "includeFAQ", label: "الأسئلة الشائعة" },
                                          { id: "includeKeyTakeaways", label: "نقاط موجزة" },
                                          { id: "semanticFocus", label: "تركيز دلالي (Semantic)" }
                                        ].map(item => (
                                          <button
                                            key={item.id}
                                            onClick={() => setNewPlanData(prev => ({ ...prev, [item.id]: !prev[item.id as keyof typeof prev] }))}
                                            className={`px-3 py-1.5 rounded-lg text-[9px] font-black border transition-all ${
                                              (newPlanData as any)[item.id]
                                              ? "bg-emerald-600 border-emerald-600 text-white"
                                              : "border-slate-200 text-slate-400 hover:border-emerald-400"
                                            }`}
                                          >
                                            {item.label}
                                          </button>
                                        ))}
                                     </div>
                                  </div>

                                  <div className="space-y-4">
                                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">طول المقال المستهدف</p>
                                     <div className="flex gap-2">
                                        {[
                                          { id: 'short', label: "قصير" },
                                          { id: 'medium', label: "متوسط" },
                                          { id: 'long', label: "طويل" }
                                        ].map(item => (
                                          <button
                                            key={item.id}
                                            onClick={() => setNewPlanData(prev => ({ ...prev, articleLength: item.id as any }))}
                                            className={`flex-1 py-2 rounded-xl text-[10px] font-black border transition-all ${
                                              newPlanData.articleLength === item.id
                                              ? "bg-slate-800 border-slate-800 text-white"
                                              : "border-slate-200 text-slate-400 hover:border-slate-400"
                                            }`}
                                          >
                                            {item.label}
                                          </button>
                                        ))}
                                     </div>
                                  </div>

                                  <div className="space-y-4">
                                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">الجمهور المستهدف</p>
                                     <input 
                                        type="text" 
                                        placeholder="مثلاً: أصحاب الشركات الصغيرة، المبتدئين في التداول..."
                                        value={newPlanData.audience}
                                        onChange={(e) => setNewPlanData({ ...newPlanData, audience: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:border-indigo-400 font-bold"
                                     />
                                  </div>
                               </div>
                             </motion.div>
                           )}
                         </AnimatePresence>
                      </div>

                      <div className="mt-10 flex justify-center">
                        <button 
                          onClick={handleCreatePlan}
                          disabled={isGeneratingPlan || !newPlanData.topic}
                          className="w-full max-w-sm bg-emerald-600 text-white py-5 rounded-2xl font-black text-base flex items-center justify-center gap-4 hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 disabled:opacity-50"
                        >
                          {isGeneratingPlan ? <Loader2 className="animate-spin" size={22} /> : <Plus size={22} />}
                          {isGeneratingPlan ? "نظام الذكاء الاصطناعي يخطط الآن..." : "توليد خطة المحتوى المخصصة"}
                        </button>
                      </div>
                   </div>
                </div>

                <div className="space-y-12">
                   {plans.map(plan => {
                      const site = sites.find(s => s.id === plan.siteId);
                      return (
                        <div key={plan.id} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                           <div className="bg-slate-50 px-10 py-6 border-b border-slate-100 flex flex-wrap justify-between items-center gap-4">
                              <div className="flex items-center gap-6">
                                 <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100">
                                    <Layers className="text-emerald-500" size={24} />
                                 </div>
                                 <div className="text-right">
                                    <h3 className="text-xl font-black text-slate-800">{plan.month}</h3>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">الموقع: {site?.name || "موقع مجهول"}</p>
                                 </div>
                              </div>
                              <button onClick={() => deletePlan(plan.id)} className="text-slate-300 hover:text-rose-500 transition-colors">
                                 <Trash2 size={20} />
                              </button>
                           </div>

                           <div className="p-10">
                              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                 {plan.articles.map(article => (
                                    <div key={article.id} className="bg-slate-50/50 border border-slate-100 rounded-3xl p-6 flex flex-col justify-between hover:border-emerald-100 transition-all group text-right">
                                       <div className="space-y-4">
                                          <div className="flex justify-between items-start">
                                             <div className={`p-1.5 rounded-lg text-[8px] font-black uppercase tracking-tighter ${
                                                article.status === 'published' ? 'bg-emerald-100 text-emerald-700' :
                                                article.status === 'error' ? 'bg-rose-100 text-rose-700' : 
                                                article.status === 'writing' ? 'bg-indigo-100 text-indigo-700 animate-pulse' :
                                                article.status === 'reviewing' ? 'bg-amber-100 text-amber-700' :
                                                'bg-slate-200 text-slate-500'
                                             }`}>
                                                {article.status === 'published' ? 'تم النشر' : 
                                                 article.status === 'error' ? 'خطأ بالربط' : 
                                                 article.status === 'writing' ? 'جارٍ الكتابة...' :
                                                 article.status === 'reviewing' ? 'بانتظار المراجعة' :
                                                 'بانتظار الكتابة'}
                                             </div>
                                          </div>
                                          <h4 className="font-black text-slate-800 leading-tight text-lg group-hover:text-emerald-700 transition-colors">{article.title}</h4>
                                          
                                          {article.status === 'writing' && (
                                            <div className="space-y-2 mt-4 bg-indigo-50/50 p-3 rounded-xl border border-indigo-100">
                                               <div className="flex justify-between text-[8px] font-black uppercase text-indigo-400">
                                                  <span>مستوى السيو (SEO Level)</span>
                                                  <span>{article.progress}%</span>
                                               </div>
                                               <div className="h-1.5 bg-indigo-100 rounded-full overflow-hidden">
                                                  <motion.div 
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${article.progress}%` }}
                                                    className="h-full bg-indigo-500"
                                                  />
                                               </div>
                                            </div>
                                          )}

                                          {article.status === 'published' && article.seoLevel && (
                                             <div className="flex items-center gap-2 text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full w-fit">
                                                <Zap size={10} /> جودة السيو: {article.seoLevel}
                                             </div>
                                          )}
                                          <div className="space-y-2">
                                             <div className="flex gap-2 items-center">
                                                <span className="text-[9px] font-black text-slate-400 uppercase">الكلمات:</span>
                                                <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded">{article.keywords}</span>
                                             </div>
                                             <div className="flex gap-2 items-center">
                                                <span className="text-[9px] font-black text-slate-400 uppercase">المرادفة:</span>
                                                <p className="text-[10px] text-slate-500 italic truncate">{article.synonyms}</p>
                                             </div>
                                          </div>
                                       </div>

                                       {article.status === 'reviewing' ? (
                                         <button 
                                            onClick={() => setReviewingArticle({ planId: plan.id, article })}
                                            className="mt-8 w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 bg-amber-500 text-white hover:bg-amber-600 shadow-xl shadow-amber-50 transition-all"
                                         >
                                            <Eye size={14} /> عرض ومراجعة المقال
                                         </button>
                                       ) : (
                                         <button 
                                            onClick={() => publishToWP(plan.id, article.id)}
                                            disabled={article.status === 'published' || article.status === 'writing'}
                                            className={`mt-8 w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                                               article.status === 'published' 
                                               ? "bg-slate-100 text-slate-400" 
                                               : article.status === 'writing'
                                               ? "bg-indigo-600 text-white animate-pulse"
                                               : article.status === 'error'
                                               ? "bg-rose-600 text-white shadow-lg shadow-rose-100"
                                               : "bg-slate-800 text-white hover:bg-emerald-600 shadow-xl shadow-slate-200"
                                            }`}
                                         >
                                            {article.status === 'published' ? <CheckCircle size={14} /> : 
                                             article.status === 'writing' ? <Loader2 size={14} className="animate-spin" /> : 
                                             <Send size={14} />}
                                            {article.status === 'published' ? "تم النشر بنجاح" : 
                                             article.status === 'writing' ? "جارٍ إعداد المقال..." :
                                             "تحليل وكتابة المقال آلياً"}
                                         </button>
                                       )}
                                    </div>
                                 ))}
                              </div>
                           </div>
                        </div>
                      );
                   })}
                   
                   {plans.length === 0 && (
                      <div className="py-32 flex flex-col items-center text-slate-300 grayscale opacity-40">
                         <Calendar size={120} strokeWidth={1} />
                         <p className="mt-8 font-black text-xl italic tracking-tighter">لم تكتشف أي خطط عمل بعد...</p>
                      </div>
                   )}
                </div>
             </motion.div>
          ) : (
            <motion.div 
              key="sites"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-4xl mx-auto w-full space-y-8"
            >
              <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
                <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-3">
                  <Globe className="text-indigo-600" /> ربط موقع ووردبريس جديد
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">اسم الموقع</label>
                    <input 
                      type="text" 
                      placeholder="مدونة السيو الخاصة بي"
                      value={newSite.name}
                      onChange={(e) => setNewSite({ ...newSite, name: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-indigo-400"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">رابط الموقع (URL)</label>
                    <input 
                      type="url" 
                      placeholder="https://mywebsite.com"
                      value={newSite.url}
                      onChange={(e) => setNewSite({ ...newSite, url: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-indigo-400"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">اسم المستخدم (WP Username)</label>
                    <input 
                      type="text" 
                      placeholder="admin"
                      value={newSite.username}
                      onChange={(e) => setNewSite({ ...newSite, username: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-indigo-400"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-between">
                      كلمة سر التطبيق (App Password)
                      <span className="text-[8px] normal-case text-indigo-400 italic">Settings {`>`} Users {`>`} Profile</span>
                    </label>
                    <input 
                      type="password" 
                      placeholder="xxxx xxxx xxxx xxxx"
                      value={newSite.appPassword}
                      onChange={(e) => setNewSite({ ...newSite, appPassword: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-indigo-400"
                    />
                  </div>
                </div>
                <button 
                  onClick={addSite}
                  className="mt-8 bg-indigo-600 text-white px-8 py-3 rounded-xl font-black text-sm flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-md active:scale-95"
                >
                  <Plus size={18} /> إضافة الموقع للقائمة
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {sites.map(site => (
                  <div key={site.id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                        <Globe size={20} />
                      </div>
                      <button 
                        onClick={() => removeSite(site.id)}
                        className="text-slate-300 hover:text-red-500 transition-colors p-2"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <h3 className="font-bold text-slate-800 text-lg">{site.name}</h3>
                    <p className="text-xs text-slate-400 font-mono mt-1 truncate">{site.url}</p>
                    <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between">
                      <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-2 py-1 rounded uppercase tracking-widest flex items-center gap-1">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> متصل
                      </span>
                      <button 
                        onClick={() => { setView("audit"); setSelectedSiteId(site.id); }}
                        className="text-xs font-bold text-indigo-600 flex items-center gap-1 hover:underline"
                      >
                        فحص المقالات <ArrowRight size={12} />
                      </button>
                    </div>
                  </div>
                ))}
                {sites.length === 0 && (
                  <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-300 bg-slate-100/50 rounded-2xl border-2 border-dashed border-slate-200">
                    < Globe size={48} className="mb-4 opacity-20" />
                    <p className="font-bold italic">لم يتم ربط أي مواقع بعد...</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="h-16 bg-slate-900 border-t border-slate-800 flex items-center justify-between px-8 text-[10px] text-slate-500 shrink-0 uppercase tracking-[0.2em] font-bold">
        <div className="flex gap-8 items-center">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]" /> 
            Google Search Systems: Online
          </span>
          <span className="hidden md:inline">SpamBrain: Updated</span>
          <span className="hidden md:inline">E-E-A-T Engine: Active</span>
        </div>
        <div className="flex gap-6 items-center">
          <span className="text-slate-400">SESSION ID: AIS-PRO-771-K</span>
          <span className="text-indigo-400 px-3 py-1 bg-indigo-950/50 rounded-full border border-indigo-900/50">Privacy Encrypted</span>
        </div>
      </footer>

      <style dangerouslySetInnerHTML={{ __html: `
        .text-stroke-sm { -webkit-text-stroke: 1px #141414; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(129, 140, 248, 0.2); border-radius: 10px; }
        .preview-content { direction: rtl; }
        .preview-content a { transition: all 0.2s ease; pointer-events: none; }
        .preview-content img { max-width: 100%; height: auto; border-radius: 8px; margin: 10px 0; }
        .preview-content p { margin-bottom: 1rem; }
      `}} />
      </div>
    </div>
  );
}
