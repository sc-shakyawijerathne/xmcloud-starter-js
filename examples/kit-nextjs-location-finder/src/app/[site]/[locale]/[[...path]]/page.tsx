import { isDesignLibraryPreviewData } from '@sitecore-content-sdk/nextjs/editing';
import { notFound } from 'next/navigation';
import { draftMode, headers } from 'next/headers';
import { SiteInfo } from '@sitecore-content-sdk/nextjs';
import sites from '.sitecore/sites.json';
import { routing } from 'src/i18n/routing';
import scConfig from 'sitecore.config';
import client from 'src/lib/sitecore-client';
import Layout, { RouteFields } from 'src/Layout';
import Providers from 'src/Providers';
import { NextIntlClientProvider } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import {
  generateWebPageSchema,
  generateProductSchema,
} from 'src/lib/structured-data/schema';
import { StructuredData } from '@/components/structured-data/StructuredData';
import { getBaseUrl, getFullUrl } from '@/lib/utils';

type PageProps = {
  params: Promise<{
    site: string;
    locale: string;
    path?: string[];
    [key: string]: string | string[] | undefined;
  }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function Page({ params, searchParams }: PageProps) {
  const { site, locale, path } = await params;
  const draft = await draftMode();
  const headersList = await headers();
  const host = headersList.get('host');

  setRequestLocale(`${site}_${locale}`);

  // Fetch the page data from Sitecore
  let page;
  if (draft.isEnabled) {
    const editingParams = await searchParams;
    if (isDesignLibraryPreviewData(editingParams)) {
      page = await client.getDesignLibraryData(editingParams);
    } else {
      page = await client.getPreview(editingParams);
    }
  } else {
    page = await client.getPage(path ?? [], { site, locale });
  }

  if (!page) {
    notFound();
  }

  // Generate page-specific structured data
  const fields = page.layout.sitecore.route?.fields as RouteFields;
  const pageTitle = fields?.Title?.value?.toString() || fields?.pageTitle?.value?.toString() || 'Page';
  const pageDescription = fields?.metadataDescription?.value?.toString() || fields?.ogDescription?.value?.toString();
  const currentPath = path?.length ? `/${path.join('/')}` : '/';
  const fullUrl = getFullUrl(currentPath, host);
  const webPageSchema = generateWebPageSchema(pageTitle, fullUrl, pageDescription, locale);

  // Detect if this is a product page and generate Product schema
  const isProductPage = path && path[0] === 'Products';
  const productSchema = isProductPage
    ? generateProductSchema(
        pageTitle,
        fields?.pageSummary?.value?.toString() || pageDescription,
        fields?.thumbnailImage?.value?.src || fields?.ogImage?.value?.src,
        fullUrl,
        undefined // Price not available on detail pages by default
      )
    : null;

  return (
    <NextIntlClientProvider>
      <Providers page={page}>
        {/* Page-specific structured data */}
        <StructuredData id="webpage-schema" data={webPageSchema} />
        {productSchema && <StructuredData id="product-schema-page" data={productSchema} />}
        <Layout page={page} />
      </Providers>
    </NextIntlClientProvider>
  );
}

// Configure dynamic rendering to avoid SSR issues with client-side hooks
// This ensures all pages are rendered on-demand rather than pre-rendered at build time
export const dynamic = 'force-dynamic';

// This function gets called at build and export time to determine
// pages for SSG ("paths", as tokenized array).
export const generateStaticParams = async () => {
  if (process.env.NODE_ENV !== 'development' && scConfig.generateStaticPaths) {
    // Filter sites to only include the sites this starter is designed to serve.
    // This prevents cross-site build errors when multiple starters share the same XM Cloud instance.
    const defaultSite = scConfig.defaultSite;
    const allowedSites = defaultSite
      ? sites
          .filter((site: SiteInfo) => site.name === defaultSite)
          .map((site: SiteInfo) => site.name)
      : sites.map((site: SiteInfo) => site.name);
    return await client.getAppRouterStaticParams(
      allowedSites,
      routing.locales.slice(),
    );
  }
  return [];
};

// Metadata fields for the page.
export const generateMetadata = async ({ params }: PageProps) => {
  const headersList = await headers();
  const host = headersList.get('host');
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
  const baseUrl = `${protocol}://${host}`;

  const { site, locale, path } = await params;

  // Construct the canonical URL using the public-facing path (what users see in browser)
  // The middleware rewrites / -> /site/locale internally, but canonical should match the browser URL
  const pathSegment = path?.length ? `/${path.join('/')}` : '';
  const canonicalUrl = `${baseUrl}${pathSegment}`;

  const page = await client.getPage(path ?? [], { site, locale });
  const fields = page?.layout.sitecore.route?.fields as RouteFields;

  // Parse keywords from comma-separated string to array
  const keywordsString = fields?.metadataKeywords?.value?.toString() || '';
  const keywords = keywordsString
    ? keywordsString.split(',').map((k: string) => k.trim())
    : [];

  return {
    title: fields?.ogTitle?.value?.toString() || 'Page',
    description:
      fields?.ogDescription?.value?.toString() || 'Sitecore Next.js Alaris Example',
    keywords,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: fields?.Title?.value?.toString() || 'Page',
      description:
        fields?.ogDescription?.value?.toString() || 'Sitecore Next.js Alaris Example',
      url: canonicalUrl,
      images: fields?.ogImage?.value?.src || undefined,
    },
  };
};
