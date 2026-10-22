import { SeoCrawlResult, SeoIssue } from '../../types/index.ts';

export class WebsiteCrawlerService {
  public async crawl(targetUrl: string): Promise<SeoCrawlResult> {
    let normalizedUrl = targetUrl.trim();
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = 'https://' + normalizedUrl;
    }

    const issues: SeoIssue[] = [];
    const urlObj = new URL(normalizedUrl);
    const domain = urlObj.origin;

    const startTime = Date.now();
    let html = '';
    let responseTimeMs = 0;
    const isHttps = normalizedUrl.startsWith('https://');

    if (!isHttps) {
      issues.push({
        id: 'iss_' + Date.now() + '_1',
        severity: 'Critical',
        category: 'Indexability',
        url: normalizedUrl,
        description: 'Site is served over insecure HTTP.',
        recommendation: 'Enforce HTTPS with an SSL/TLS certificate across all pages.',
        status: 'Open'
      });
    }

    try {
      const res = await fetch(normalizedUrl, {
        headers: { 'User-Agent': 'LocalOS-SEO-Bot/1.0 (+https://localos.ai/bot)' }
      });
      responseTimeMs = Date.now() - startTime;
      html = await res.text();
    } catch (err: any) {
      responseTimeMs = Date.now() - startTime;
      issues.push({
        id: 'iss_' + Date.now() + '_conn',
        severity: 'Critical',
        category: 'Indexability',
        url: normalizedUrl,
        description: `Failed to connect to website: ${err.message}`,
        recommendation: 'Verify the domain exists and DNS records resolve correctly.',
        status: 'Open'
      });

      return this.buildFallbackResult(normalizedUrl, issues, responseTimeMs);
    }

    // Check robots.txt
    let robotsTxtFound = false;
    try {
      const robotsRes = await fetch(`${domain}/robots.txt`);
      robotsTxtFound = robotsRes.ok && (await robotsRes.text()).length > 0;
    } catch (e) {
      robotsTxtFound = false;
    }
    if (!robotsTxtFound) {
      issues.push({
        id: 'iss_' + Date.now() + '_robots',
        severity: 'Medium',
        category: 'Indexability',
        url: `${domain}/robots.txt`,
        description: 'robots.txt file was not found.',
        recommendation: 'Create a robots.txt file to guide search engine crawlers and point to your sitemap.',
        status: 'Open'
      });
    }

    // Check sitemap.xml
    let sitemapFound = false;
    try {
      const sitemapRes = await fetch(`${domain}/sitemap.xml`);
      sitemapFound = sitemapRes.ok;
    } catch (e) {
      sitemapFound = false;
    }
    if (!sitemapFound) {
      issues.push({
        id: 'iss_' + Date.now() + '_sitemap',
        severity: 'High',
        category: 'Indexability',
        url: `${domain}/sitemap.xml`,
        description: 'XML Sitemap not found at /sitemap.xml.',
        recommendation: 'Generate an XML sitemap and submit it to Google Search Console.',
        status: 'Open'
      });
    }

    // Parse HTML basics
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : '';
    const titleLength = title.length;

    if (!title) {
      issues.push({
        id: 'iss_' + Date.now() + '_title',
        severity: 'Critical',
        category: 'Metadata',
        url: normalizedUrl,
        description: 'Missing <title> tag.',
        recommendation: 'Add a descriptive page title between 50-60 characters including primary local keywords.',
        status: 'Open'
      });
    } else if (titleLength < 30 || titleLength > 65) {
      issues.push({
        id: 'iss_' + Date.now() + '_title_len',
        severity: 'Low',
        category: 'Metadata',
        url: normalizedUrl,
        description: `Page title is ${titleLength} characters (recommended 50-60).`,
        recommendation: 'Adjust title tag length to avoid truncation in Google Search results.',
        status: 'Open'
      });
    }

    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i);
    const metaDescription = descMatch ? descMatch[1].trim() : '';
    const metaDescriptionLength = metaDescription.length;

    if (!metaDescription) {
      issues.push({
        id: 'iss_' + Date.now() + '_desc',
        severity: 'High',
        category: 'Metadata',
        url: normalizedUrl,
        description: 'Missing meta description.',
        recommendation: 'Write a persuasive meta description (120-160 characters) with a clear call to action.',
        status: 'Open'
      });
    }

    // H1 tags
    const h1Matches = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/gi) || [];
    const h1Count = h1Matches.length;
    const h1Text = h1Matches && h1Matches[0] ? h1Matches[0].replace(/<[^>]+>/g, '').trim() : '';

    if (h1Count === 0) {
      issues.push({
        id: 'iss_' + Date.now() + '_h1',
        severity: 'High',
        category: 'Headings',
        url: normalizedUrl,
        description: 'Missing <h1> heading tag.',
        recommendation: 'Add a single, distinct H1 tag describing the core service and location.',
        status: 'Open'
      });
    } else if (h1Count > 1) {
      issues.push({
        id: 'iss_' + Date.now() + '_h1_multi',
        severity: 'Medium',
        category: 'Headings',
        url: normalizedUrl,
        description: `Multiple <h1> tags detected (${h1Count}).`,
        recommendation: 'Use only one primary H1 per page for clear heading hierarchy.',
        status: 'Open'
      });
    }

    // H2 tags
    const h2Matches = html.match(/<h2[^>]*>[\s\S]*?<\/h2>/gi) || [];
    const h2Count = h2Matches.length;

    // Canonical tag
    const canonicalMatch = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']*)["']/i);
    const hasCanonical = Boolean(canonicalMatch);
    const canonicalUrl = canonicalMatch ? canonicalMatch[1] : undefined;

    if (!hasCanonical) {
      issues.push({
        id: 'iss_' + Date.now() + '_canon',
        severity: 'Medium',
        category: 'Canonicalization',
        url: normalizedUrl,
        description: 'Missing rel="canonical" tag.',
        recommendation: 'Add a canonical URL tag to prevent duplicate content indexing.',
        status: 'Open'
      });
    }

    // OpenGraph
    const hasOpenGraph = /<meta[^>]*property=["']og:title["']/i.test(html);
    if (!hasOpenGraph) {
      issues.push({
        id: 'iss_' + Date.now() + '_og',
        severity: 'Low',
        category: 'Metadata',
        url: normalizedUrl,
        description: 'Missing OpenGraph social tags.',
        recommendation: 'Add og:title, og:description, and og:image tags for rich social sharing cards.',
        status: 'Open'
      });
    }

    // Structured Data / Schema
    const hasStructuredData = /application\/ld\+json/i.test(html);
    const schemaTypes: string[] = [];
    if (hasStructuredData) {
      const scriptMatches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || [];
      for (const s of scriptMatches) {
        if (/LocalBusiness|Restaurant|JewelryStore|Dentist|Store/i.test(s)) {
          schemaTypes.push('LocalBusiness');
        }
        if (/Organization/i.test(s)) schemaTypes.push('Organization');
      }
    } else {
      issues.push({
        id: 'iss_' + Date.now() + '_schema',
        severity: 'High',
        category: 'Structured Data',
        url: normalizedUrl,
        description: 'No Schema.org structured data (JSON-LD) found.',
        recommendation: 'Implement LocalBusiness schema with address, phone, opening hours, and geo coordinates.',
        status: 'Open'
      });
    }

    // Image alt tags
    const imgMatches = html.match(/<img[^>]*>/gi) || [];
    const imagesCount = imgMatches.length;
    let imagesMissingAlt = 0;
    for (const img of imgMatches) {
      if (!/alt=["'][^"']+["']/i.test(img)) {
        imagesMissingAlt++;
      }
    }
    if (imagesMissingAlt > 0) {
      issues.push({
        id: 'iss_' + Date.now() + '_imgalt',
        severity: 'Medium',
        category: 'Images',
        url: normalizedUrl,
        description: `${imagesMissingAlt} of ${imagesCount} images are missing descriptive alt text.`,
        recommendation: 'Add descriptive alt text to all meaningful images to support image SEO and accessibility.',
        status: 'Open'
      });
    }

    // Internal links count
    const linkMatches = html.match(/<a[^>]*href=["']([^"']*)["']/gi) || [];
    const internalLinksCount = linkMatches.filter(l => !l.includes('http') || l.includes(domain)).length;

    // Deterministic Category Scoring
    let indexabilityScore = 20;
    if (!isHttps) indexabilityScore -= 10;
    if (!robotsTxtFound) indexabilityScore -= 5;
    if (!sitemapFound) indexabilityScore -= 5;

    let metadataScore = 20;
    if (!title) metadataScore -= 10;
    if (!metaDescription) metadataScore -= 8;
    if (!hasOpenGraph) metadataScore -= 2;

    let headingsScore = 15;
    if (h1Count === 0) headingsScore -= 10;
    if (h1Count > 1) headingsScore -= 5;

    let canonicalScore = 15;
    if (!hasCanonical) canonicalScore -= 15;

    let schemaScore = 15;
    if (!hasStructuredData) schemaScore -= 15;

    let mediaScore = 15;
    if (imagesMissingAlt > 0) mediaScore -= Math.min(10, imagesMissingAlt * 2);

    const totalScore = Math.max(0, Math.min(100, (
      Math.max(0, indexabilityScore) +
      Math.max(0, metadataScore) +
      Math.max(0, headingsScore) +
      Math.max(0, canonicalScore) +
      Math.max(0, schemaScore) +
      Math.max(0, mediaScore)
    )));

    return {
      url: normalizedUrl,
      crawledAt: new Date().toISOString(),
      totalScore,
      categoryScores: {
        Indexability: { earned: Math.max(0, indexabilityScore), total: 20, reason: isHttps ? 'HTTPS enforced' : 'Insecure HTTP' },
        Metadata: { earned: Math.max(0, metadataScore), total: 20, reason: title ? 'Title and tags analyzed' : 'Missing title' },
        Headings: { earned: Math.max(0, headingsScore), total: 15, reason: h1Count === 1 ? 'Optimal single H1' : 'H1 issue' },
        Canonicalization: { earned: Math.max(0, canonicalScore), total: 15, reason: hasCanonical ? 'Canonical tag present' : 'Missing canonical' },
        StructuredData: { earned: Math.max(0, schemaScore), total: 15, reason: hasStructuredData ? 'JSON-LD detected' : 'Missing schema' },
        Images: { earned: Math.max(0, mediaScore), total: 15, reason: imagesMissingAlt === 0 ? 'All images have alt tags' : `${imagesMissingAlt} missing alt` }
      },
      issues,
      metrics: {
        https: isHttps,
        robotsTxtFound,
        sitemapFound,
        title,
        titleLength,
        metaDescription,
        metaDescriptionLength,
        h1Count,
        h1Text,
        h2Count,
        hasCanonical,
        canonicalUrl,
        hasOpenGraph,
        hasStructuredData,
        schemaTypes,
        imagesCount,
        imagesMissingAlt,
        internalLinksCount,
        responseTimeMs
      }
    };
  }

  private buildFallbackResult(url: string, issues: SeoIssue[], responseTimeMs: number): SeoCrawlResult {
    return {
      url,
      crawledAt: new Date().toISOString(),
      totalScore: 25,
      categoryScores: {
        Indexability: { earned: 5, total: 20, reason: 'Site connection failed or timed out' },
        Metadata: { earned: 0, total: 20, reason: 'Unable to parse HTML' },
        Headings: { earned: 0, total: 15, reason: 'Unable to parse HTML' },
        Canonicalization: { earned: 0, total: 15, reason: 'Unable to parse HTML' },
        StructuredData: { earned: 0, total: 15, reason: 'Unable to parse HTML' },
        Images: { earned: 5, total: 15, reason: 'Unable to parse HTML' }
      },
      issues,
      metrics: {
        https: url.startsWith('https://'),
        robotsTxtFound: false,
        sitemapFound: false,
        title: '',
        titleLength: 0,
        metaDescription: '',
        metaDescriptionLength: 0,
        h1Count: 0,
        h1Text: '',
        h2Count: 0,
        hasCanonical: false,
        hasOpenGraph: false,
        hasStructuredData: false,
        schemaTypes: [],
        imagesCount: 0,
        imagesMissingAlt: 0,
        internalLinksCount: 0,
        responseTimeMs
      }
    };
  }
}

export const websiteCrawlerService = new WebsiteCrawlerService();
