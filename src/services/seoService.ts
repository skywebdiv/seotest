import { GoogleGenAI, Type } from "@google/genai";

export interface EEATComponent {
  score: number;
  feedback: string;
}

export interface EEATImprovement {
  originalPart: string;
  suggestedImprovement: string;
  reason: string;
}

export interface InternalArticleSuggestion {
  title: string;
  relevance: string;
}

export interface CompetitorAnalysis {
  name: string;
  topContentSummary: string;
  improvementToOutperform: string;
}

export interface SEOAnalysis {
  generalRating: number;
  summary: string;
  eeat: {
    expertise: EEATComponent;
    authoritativeness: EEATComponent;
    trustworthiness: EEATComponent;
  };
  eeatImprovements: EEATImprovement[];
  strengths: string[];
  criticalNotes: string[];
  linkRecommendations: string[];
  missingSuggestions: string[];
  internalArticleSuggestions: InternalArticleSuggestion[];
  competitors: CompetitorAnalysis[];
  technicalMetadata: {
    internalLinksCount: number;
    externalLinksCount: number;
    spamStatus: string;
    isSpamSafe: boolean;
  };
  analyzedContentHtml?: string;
}

let aiInstance: GoogleGenAI | null = null;

function getAI() {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined");
    }
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiInstance;
}

export interface SEOAnalysisOptions {
  focusEEAT?: ("expertise" | "authority" | "trust")[];
  prioritySpam?: ("keyword-stuffing" | "hidden-text" | "automated-content")[];
  customContext?: string;
}

export async function analyzeSEO(
  content: string, 
  isUrl: boolean, 
  options: SEOAnalysisOptions = {}
): Promise<SEOAnalysis> {
  const ai = getAI();
  
  const eeatFocus = options.focusEEAT?.length 
    ? `ركز بشكل خاص على جوانب E-E-A-T التالية: ${options.focusEEAT.join(", ")}.` 
    : "";
    
  const spamPriority = options.prioritySpam?.length 
    ? `أعطِ أولوية لكشف ممارسات السبام التالية: ${options.prioritySpam.join(", ")}.` 
    : "";

  const systemInstruction = `أنت خبير محترف في تحسين محركات البحث (SEO Specialist) ومدقق محتوى متخصص في معايير "Google Spam Policies" وتحديثات "Helpful Content" لعام 2026.
مهمتك هي تحليل المقالات والروابط بدقة تقنية عالية بناءً على:
1. تحليل المحتوى (القيمة النوعية، E-E-A-T، كشف النص غير المرغوب، التحسين اللغوي).
2. فحص الروابط (الخارجية، الداخلية، النص الرابط).
3. تحديد الفجوات المعرفية والمحتوى الناقص الذي من شأنه تقوية المقال (مقترحات لزيادة القيمة النوعية).
4. تحديد الأجزاء التي تفتقر لمعايير E-E-A-T وتقديم اقتراحات عملية ومحددة للغاية لتحسينها. يجب أن تتضمن هذه الاقتراحات:
   - أمثلة واقعية لإعادة صياغة الجمل (مثل: "بدلاً من قول 'س'، قل 'ص' لأنها تظهر كذا").
   - إضافة أدلة ملموسة (Evidence/Proof) مثل الدراسات المحددة بالأسماء، الإحصائيات الحديثة مع ذكر الجهة، أو تفاصيل تجارب شخصية واقعية تثبت الخبرة العملية.
   - الاقتراح يجب أن يكون نصاً جاهزاً للاستخدام (Ready-to-use content) وليس مجرد نصيحة عامة.
5. تجنب العناوين المضللة (Clickbait) والتركيز على تلبية "نية البحث" (Search Intent) بدقة متناهية وفق معايير 2026.
6. اقتراح عناوين لمقالات أخرى جديدة يمكن كتابتها في الموقع لتعزيز الربط الداخلي (Internal Linking) وبناء عنقود محتوى (Content Cluster) حول هذا الموضوع.

تفصيل معايير E-E-A-T المطلوبة في الاقتراحات:
- الخبرة: ذكر تفاصيل دقيقة أو تجارب شخصية بدلاً من العموميات.
- المصداقية: الاستشهاد بمصادر موثوقة أو بيانات رسمية.
- الموثوقية: إظهار الشفافية في عرض المعلومات وتوفير مراجع.

يجب عليك تقديم تحليل مفصل لكل ركيزة من ركائز E-E-A-T (الخبرة، المصداقية، الموثوقية) مع إعطاء درجة من 100 وتعليق توضيحي لكل منها.

${eeatFocus}
${spamPriority}
${options.customContext ? `سياق إضافي للمحلل: ${options.customContext}` : ""}

يجب أن تكون المخرجات باللغة العربية بالضبط وفق الهيكل التالي:
- التقييم العام (Rating out of 10)
- ملخص سريع
- تحليل E-E-A-T (الخبرة، المصداقية، الموثوقية مع الدرجات والتعليقات)
- مقترحات تحسين النص وفق E-E-A-T (الجزء الأصلي، النص المقترح، السبب)
- نقاط القوة
- الملاحظات الحرجة (يجب إصلاحها)
- توصيات الروابط
- مقترحات المحتوى الناقص (لتقوية المقال)
- مقترحات مقالات جديدة للربط الداخلي (العنوان، سبب الارتباط)
- تحليل المنافسين الـ 3 الأوائل (اسم المنافس، تحليل محتواه المتصدر، وكيفية التفوق عليه)
- البيانات التقنية المستخرجة (عدد الروابط الداخلية، عدد الروابط الخارجية، حالة السبام)

Return the response strictly as a JSON object matching the provided schema.`;

  const prompt = isUrl 
    ? `Analyze the content of this URL for SEO and Spam Policies: ${content}`
    : `Analyze the following text for SEO and Spam Policies:\n\n${content}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["generalRating", "summary", "eeat", "eeatImprovements", "strengths", "criticalNotes", "linkRecommendations", "missingSuggestions", "internalArticleSuggestions", "competitors", "technicalMetadata"],
          properties: {
            generalRating: { type: Type.NUMBER, description: "Rating from 1 to 10" },
            summary: { type: Type.STRING, description: "Quick summary in Arabic" },
            eeat: {
              type: Type.OBJECT,
              required: ["expertise", "authoritativeness", "trustworthiness"],
              properties: {
                expertise: {
                  type: Type.OBJECT,
                  required: ["score", "feedback"],
                  properties: {
                    score: { type: Type.NUMBER },
                    feedback: { type: Type.STRING }
                  }
                },
                authoritativeness: {
                  type: Type.OBJECT,
                  required: ["score", "feedback"],
                  properties: {
                    score: { type: Type.NUMBER },
                    feedback: { type: Type.STRING }
                  }
                },
                trustworthiness: {
                  type: Type.OBJECT,
                  required: ["score", "feedback"],
                  properties: {
                    score: { type: Type.NUMBER },
                    feedback: { type: Type.STRING }
                  }
                }
              }
            },
            eeatImprovements: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["originalPart", "suggestedImprovement", "reason"],
                properties: {
                  originalPart: { type: Type.STRING, description: "The part of text that lacks E-E-A-T" },
                  suggestedImprovement: { type: Type.STRING, description: "The suggested improved version. MUST include concrete examples of rephrasing and mentions of specific evidence (data, studies, or expertise-based details)." },
                  reason: { type: Type.STRING, description: "Detailed explanation of how this change specifically boosts Expertise, Authoritativeness, or Trust (e.g. by citing a source or showing hands-on experience)." }
                }
              }
            },
            strengths: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "List of strengths in Arabic"
            },
            criticalNotes: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "List of critical issues to fix in Arabic"
            },
            linkRecommendations: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "List of link recommendations in Arabic"
            },
            missingSuggestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of suggestions for missing content or info that would strengthen the article in Arabic"
            },
            internalArticleSuggestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["title", "relevance"],
                properties: {
                  title: { type: Type.STRING, description: "Suggested new article title in Arabic" },
                  relevance: { type: Type.STRING, description: "How it relates to the current article for linking in Arabic" }
                }
              }
            },
            competitors: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["name", "topContentSummary", "improvementToOutperform"],
                properties: {
                  name: { type: Type.STRING, description: "Name of the competitor (e.g., Website Name)" },
                  topContentSummary: { type: Type.STRING, description: "Brief analysis of their top-ranking content on this topic in Arabic" },
                  improvementToOutperform: { type: Type.STRING, description: "Specific strategy to outperform them in Arabic" }
                }
              },
              description: "Top 3 direct competitors analysis"
            },
            technicalMetadata: {
              type: Type.OBJECT,
              required: ["internalLinksCount", "externalLinksCount", "spamStatus", "isSpamSafe"],
              properties: {
                internalLinksCount: { type: Type.NUMBER },
                externalLinksCount: { type: Type.NUMBER },
                spamStatus: { type: Type.STRING, description: "Arabic description of spam check result" },
                isSpamSafe: { type: Type.BOOLEAN }
              }
            }
          }
        },
      },
    });

    if (!response.text) {
      throw new Error("No response from AI");
    }

    return JSON.parse(response.text.trim()) as SEOAnalysis;
  } catch (error) {
    console.error("SEO Analysis Error:", error);
    throw error;
  }
}

export async function generateContentPlan(
  topic: string, 
  count: number = 5,
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
  } = {}
): Promise<{ title: string; keywords: string; synonyms: string }[]> {
  const ai = getAI();
  
  const eeatText = options.eeatFocus?.length 
    ? `ركز بشكل مكثف على معايير E-E-A-T التالية: ${options.eeatFocus.join(", ")}.` 
    : "";
    
  const locationText = options.location?.country 
    ? `الجمهور المستهدف يقع في: ${options.location.country}${options.location.city ? ` (مدينة ${options.location.city})` : ""}.` 
    : "";

  const marketingText = `
نبرة الصوت المطلوبة: ${options.tone || "احترافية وإقناعية"}
الجمهور المستهدف: ${options.audience || "عام"}
الهدف التسويقي: ${options.goal || "زيادة الوعي وبناء السلطة المعرفية"}
  `.trim();

  const systemInstruction = `أنت مخطط محتوى محترف (Content Strategist) وخبير في التسويق بالمحتوى.
مهمتك هي إنشاء خطة عناوين مقالات بناءً على موضوع رئيسي ومعايير محددة.
لكل مقال مقترح، يجب عليك تقديم:
1. عناوين جذابة ومحسنة للسيو (SEO Title) تتناسب مع ثقافة الجمهور المستهدف.
2. الكلمات المفتاحية الأساسية المستهدفة التي يبحث عنها الجمهور في المنطقة المحددة.
3. الكلمات المفتاحية المرادفة والجانبية (LSI Keywords).

${eeatText}
${locationText}
${marketingText}

يجب أن تكون المقترحات باللغة العربية وتراعي اللهجة أو المتطلبات المحلية إذا تم تحديد موقع.
Return the response strictly as a JSON array of objects.`;

  const prompt = `Generate a highly effective monthly content plan for the topic: "${topic}". Suggest ${count} unique articles that align with the marketing goals and E-E-A-T criteria above.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            required: ["title", "keywords", "synonyms"],
            properties: {
              title: { type: Type.STRING },
              keywords: { type: Type.STRING },
              synonyms: { type: Type.STRING }
            }
          }
        },
      },
    });

    return JSON.parse(response.text.trim());
  } catch (error) {
    console.error("Content Plan Generation Error:", error);
    throw error;
  }
}

export interface KeywordGapAnalysis {
  existingKeywords: { keyword: string; coverage: number; count: number }[];
  missingKeywords: { keyword: string; difficulty: string; potential: string }[];
  suggestedTopics: { title: string; primaryKeyword: string; reason: string }[];
}

export async function generateSeoTitles(keywords: string[]): Promise<{ keyword: string; titles: string[] }[]> {
  const ai = getAI();
  
  const systemInstruction = `أنت خبير سيو وكاتب محتوى إبداعي. مهمتك هي إنشاء عناوين جذابة وقوية لمجموعة من الكلمات المفتاحية.
يجب أن تلتزم بمعايير جوجل 2026 التي تركز على:
1. تقديم قيمة حقيقية وفورية للمستخدم (Helpful Content).
2. الشمولية والمصداقية (E-E-A-T).
3. المنع التام للعناوين المضللة (Strictly No Clickbait) والتركيز على العناوين التي تفي بوعود المحتوى بدقة 100%.
4. استهداف نية البحث (Search Intent) بشكل عميق وتفصيلي (النية المعلوماتية، التجارية، الملاحية أو نية الشراء).

لكل كلمة مفتاحية، قم بتوليد 3 خيارات للعناوين:
- عنوان تعليمي (How-to / Guide)
- عنوان قائمة (Listicle / Numbers)
- عنوان مستند إلى الخبرة أو الرأي (Expertise / Review)

أخرج النتيجة بتنسيق JSON حصراً.`;

  const prompt = `قم بتوليد عناوين جذابة للكلمات المفتاحية التالية:
${keywords.join("\n")}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            required: ["keyword", "titles"],
            properties: {
              keyword: { type: Type.STRING },
              titles: { 
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            }
          }
        }
      },
    });

    return JSON.parse(response.text.trim());
  } catch (error) {
    console.error("Title Generation Error:", error);
    throw error;
  }
}

export async function analyzeKeywordGap(
  titles: string[], 
  niche: string
): Promise<KeywordGapAnalysis> {
  const ai = getAI();
  
  const systemInstruction = `أنت خبير سيو محترف (SEO Strategist) متخصص في تحليل فجوات المحتوى (Content Gap Analysis).
بناءً على قائمة عناوين المقالات الموجودة في موقع العميل والمجال الذي يعمل فيه، قم بما يلي:
1. استخرج الكلمات المفتاحية الحالية التي يغطيها الموقع وقدر نسبة تغطيتها (0-100) وعدد تكرار المواضيع عنها.
2. حدد الكلمات المفتاحية ذات القيمة العالية (High-value) والمفقودة تماماً من الموقع والتي يبحث عنها المستخدمون في هذا المجال.
3. اقترح عناوين مقالات جديدة لتغطية هذه الفجوات مع ذكر الكلمة المفتاحية المستهدفة وسبب الاقتراح.

ملاحظات:
- المجال: ${niche}
- عدد العناوين المزودة: ${titles.length}

أخرج النتيجة بتنسيق JSON حصراً.`;

  const prompt = `إليك قائمة بعناوين المقالات الحالية في الموقع:
${titles.join("\n")}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["existingKeywords", "missingKeywords", "suggestedTopics"],
          properties: {
            existingKeywords: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["keyword", "coverage", "count"],
                properties: {
                  keyword: { type: Type.STRING },
                  coverage: { type: Type.NUMBER },
                  count: { type: Type.NUMBER }
                }
              }
            },
            missingKeywords: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["keyword", "difficulty", "potential"],
                properties: {
                  keyword: { type: Type.STRING },
                  difficulty: { type: Type.STRING },
                  potential: { type: Type.STRING }
                }
              }
            },
            suggestedTopics: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["title", "primaryKeyword", "reason"],
                properties: {
                  title: { type: Type.STRING },
                  primaryKeyword: { type: Type.STRING },
                  reason: { type: Type.STRING }
                }
              }
            }
          }
        }
      },
    });

    return JSON.parse(response.text.trim());
  } catch (error) {
    console.error("Keyword Gap Analysis Error:", error);
    throw error;
  }
}

export async function generateFullArticle(
  article: { title: string; keywords: string; synonyms: string },
  planOptions: { 
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
  },
  existingArticles: { title: string; url: string }[] = []
): Promise<{ content: string; seoTitle: string; metaDescription: string }> {
  const ai = getAI();
  
  const lengthMap = {
    short: "قصير (حوالي 600-800 كلمة)",
    medium: "متوسط (حوالي 1200-1500 كلمة)",
    long: "طويل وتفصيلي (أكثر من 2000 كلمة)"
  };

  const advancedSEO = `
${planOptions.includeTOC ? "- يجب تضمين جدول محتويات (Table of Contents) في بداية المقال." : ""}
${planOptions.includeFAQ ? "- يجب إضافة قسم للأسئلة الشائعة (FAQ) في نهاية المقال مع ترميز منطقي." : ""}
${planOptions.includeKeyTakeaways ? "- ابدأ المقال بقسم 'أهم النقاط' (Key Takeaways) لتلخيص الفائدة." : ""}
${planOptions.semanticFocus ? "- ركز على الكلمات الدلالية المرتبطة سياقياً (NLP & Semantic entities) لتعزيز فهم المحرك للموضوع." : ""}
- طول المقال المطلوب: ${lengthMap[planOptions.articleLength || 'medium']}.
  `.trim();

  const internalLinksContext = existingArticles.length > 0 
    ? `إليك قائمة ببعض المقالات الموجودة حالياً في الموقع. يرجى محاولة إضافة روابط داخلية (Internal Links) لـ 2-3 من هذه المقالات بشكل طبيعي داخل نص المقال الجديد إذا كانت ذات صلة بالسياق:
${existingArticles.map(a => `- [${a.title}](${a.url})`).join("\n")}`
    : "";

  const systemInstruction = `أنت كاتب مقالات محترف وخبير سيو (SEO Content Specialist) ملم بتحديثات جوجل لعام 2026.

مهمتك هي كتابة مقال كامل وحصري موجه للقارئ البشري أولاً (Helpful Content) مع دمج استراتيجية الربط الداخلي (Smart Internal Linking).

المعايير الأساسية:
العنوان المقترح: ${article.title}
الكلمات المفتاحية: ${article.keywords}
الكلمات المرادفة: ${article.synonyms}

الهدف التسويقي: ${planOptions.goal}
نبرة الصوت: ${planOptions.tone}
الجمهور المستهدف: ${planOptions.audience}
${planOptions.location ? `الاستهداف الجغرافي: ${planOptions.location.country} - ${planOptions.location.city}` : ""}

${internalLinksContext}

متطلبات السيو المتقدمة:
${advancedSEO}

متطلبات الجودة الفائقة (E-E-A-T & Google 2026 Updates):
1. الخبرة والتجربة: أظهر لمسات توحي بتجربة حقيقية ودراسة حالة واقعية.
2. الموثوقية: استشهد بإحصائيات أو مراجع موثوقة.
3. الربط الداخلي الذكي: إذا تم تزويدك بقائمة مقالات، قم بوضع روابط (HTML anchor tags) داخل النص لمواضيع ذات صلة.
4. مكافحة السبام و Clickbait: تجنب حشو الكلمات أو العناوين المضللة. ركز على نية البحث.
5. الهيكل: استخدم تنسيق HTML (H2, H3, lists).

يجب عليك أيضاً إنشاء سيو تايتل (SEO Title) وميتا ديسكريبشن (Meta Description).

أخرج النتيجة بتنسيق JSON يتوافق مع المواصفات البرمجية.`;

  const prompt = `اكتب المقال الكامل الآن مع العنوان الوصفي والوصف التعريفي (Meta Description).`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["content", "seoTitle", "metaDescription"],
          properties: {
            content: { type: Type.STRING, description: "The full article content in HTML format" },
            seoTitle: { type: Type.STRING, description: "Optimized SEO title" },
            metaDescription: { type: Type.STRING, description: "Optimized meta description" }
          }
        }
      },
    });

    return JSON.parse(response.text.trim());
  } catch (error) {
    console.error("Full Article Generation Error:", error);
    throw error;
  }
}
