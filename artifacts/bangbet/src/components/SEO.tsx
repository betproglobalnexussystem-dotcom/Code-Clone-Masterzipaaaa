import { useEffect } from "react";
import { getPageSEO, getCountryFromURL, type AppPage } from "../lib/seo";

function setMeta(attr: string, key: string, content: string) {
  let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setLink(rel: string, href: string) {
  let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

function setJsonLd(id: string, data: object) {
  let el = document.getElementById(id) as HTMLScriptElement | null;
  if (!el) {
    el = document.createElement("script");
    el.type = "application/ld+json";
    el.id = id;
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data, null, 0);
}

function removeJsonLd(id: string) {
  document.getElementById(id)?.remove();
}

interface SEOProps {
  page: AppPage;
  countryCode?: string;
}

export default function SEO({ page, countryCode }: SEOProps) {
  useEffect(() => {
    const code = countryCode || getCountryFromURL();
    const seo = getPageSEO(code, page);

    // Title
    document.title = seo.title;

    // Basic meta
    setMeta("name", "description", seo.description);
    setMeta("name", "keywords", seo.keywords);
    setMeta("name", "robots", seo.robots);
    setMeta("name", "theme-color", "#1a8a2e");

    // Open Graph
    setMeta("property", "og:title", seo.title);
    setMeta("property", "og:description", seo.description);
    setMeta("property", "og:url", seo.canonical);
    setMeta("property", "og:type", "website");
    setMeta("property", "og:site_name", "BetMali");
    setMeta("property", "og:image", seo.ogImage);
    setMeta("property", "og:image:width", "1200");
    setMeta("property", "og:image:height", "630");
    setMeta("property", "og:image:alt", seo.title);
    setMeta("property", "og:locale", "en_US");

    // Twitter Card
    setMeta("name", "twitter:card", "summary_large_image");
    setMeta("name", "twitter:site", "@betmali");
    setMeta("name", "twitter:creator", "@betmali");
    setMeta("name", "twitter:title", seo.title);
    setMeta("name", "twitter:description", seo.description);
    setMeta("name", "twitter:image", seo.ogImage);
    setMeta("name", "twitter:image:alt", seo.title);

    // Canonical
    setLink("canonical", seo.canonical);

    // Manifest & Favicon
    setLink("manifest", "/manifest.json");
    setLink("icon", "/betmali-logo.png");
    setLink("apple-touch-icon", "/betmali-logo.png");

    // Verification placeholders (fill in real codes when available)
    setMeta("name", "google-site-verification", "REPLACE_WITH_GOOGLE_VERIFICATION_CODE");
    setMeta("name", "msvalidate.01", "REPLACE_WITH_BING_VERIFICATION_CODE");

    // JSON-LD schemas
    if (seo.schemaOrg.length > 0) {
      seo.schemaOrg.forEach((schema, i) => {
        setJsonLd(`jsonld-${i}`, schema);
      });
      // Clean up extra slots from previous pages that had more schemas
      for (let i = seo.schemaOrg.length; i < 6; i++) {
        removeJsonLd(`jsonld-${i}`);
      }
    }

    // HTML lang
    document.documentElement.lang = "en";
  }, [page, countryCode]);

  return null;
}
