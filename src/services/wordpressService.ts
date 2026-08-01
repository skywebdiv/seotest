import { WordPressPost, WordPressSite } from "../types";

export async function fetchWordPressPosts(site: WordPressSite): Promise<WordPressPost[]> {
  try {
    const headers: HeadersInit = {};
    
    if (site.username && site.appPassword) {
      const auth = btoa(`${site.username}:${site.appPassword}`);
      headers["Authorization"] = `Basic ${auth}`;
    }

    const response = await fetch(`${site.url}/wp-json/wp/v2/posts?per_page=50&_fields=id,title,content,link&status=publish,draft,private`, {
      headers
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to fetch posts from WordPress site. Please check your credentials and site URL.");
    }
    
    const data = await response.json();
    
    return data.map((post: any) => ({
      id: post.id,
      title: post.title.rendered,
      content: post.content.rendered,
      link: post.link
    }));
  } catch (error) {
    console.error("WordPress Fetch Error:", error);
    throw error;
  }
}

export async function fetchPublicWordPressPosts(siteUrl: string): Promise<WordPressPost[]> {
  try {
    const formattedUrl = siteUrl.replace(/\/$/, "");
    const response = await fetch(`${formattedUrl}/wp-json/wp/v2/posts?per_page=50&_fields=id,title,link&status=publish`);
    
    if (!response.ok) {
      throw new Error("لا يمكن الوصول لبيانات الموقع العامة. تأكد من أن الموقع يعمل بنظام ووردبريس وأن واجهة البرمجة (REST API) مفتوحة.");
    }
    
    const data = await response.json();
    
    return data.map((post: any) => ({
      id: post.id,
      title: post.title.rendered,
      content: "",
      link: post.link
    }));
  } catch (error) {
    console.error("Public WordPress Fetch Error:", error);
    throw error;
  }
}

export async function createWordPressPost(
  site: WordPressSite, 
  title: string, 
  content: string,
  options: { 
    status?: 'publish' | 'draft'; 
    focusKeyword?: string;
    seoTitle?: string;
    metaDescription?: string;
  } = {}
): Promise<number> {
  try {
    const headers: HeadersInit = {
      "Content-Type": "application/json"
    };
    
    if (site.username && site.appPassword) {
      const auth = btoa(`${site.username}:${site.appPassword}`);
      headers["Authorization"] = `Basic ${auth}`;
    }

    // Prepare metadata for focus keywords (Yoast & RankMath support)
    const meta: Record<string, string> = {};
    if (options.focusKeyword) {
      meta._yoast_wpseo_focuskw = options.focusKeyword;
      meta.rank_math_focus_keyword = options.focusKeyword;
    }
    
    // SEO Title & Meta Description support
    if (options.seoTitle) {
      meta._yoast_wpseo_title = options.seoTitle;
      meta._yoast_wpseo_opengraph_title = options.seoTitle;
      meta._yoast_wpseo_twitter_title = options.seoTitle;
      meta.rank_math_title = options.seoTitle;
    }
    if (options.metaDescription) {
      meta._yoast_wpseo_metadesc = options.metaDescription;
      meta._yoast_wpseo_opengraph_description = options.metaDescription;
      meta._yoast_wpseo_twitter_description = options.metaDescription;
      meta.rank_math_description = options.metaDescription;
    }

    const response = await fetch(`${site.url}/wp-json/wp/v2/posts`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        title,
        content,
        status: options.status || "draft",
        meta: Object.keys(meta).length > 0 ? meta : undefined
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "فشل إنشاء المقال على ووردبريس. تأكد من صلاحيات الربط.");
    }
    
    const data = await response.json();
    return data.id;
  } catch (error) {
    console.error("WordPress Create Error:", error);
    throw error;
  }
}
