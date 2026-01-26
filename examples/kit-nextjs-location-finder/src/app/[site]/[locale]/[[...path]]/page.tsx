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

  return (
    <NextIntlClientProvider>
      <Providers page={page}>
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
  const url = `${protocol}://${host}`;

  const { site, locale, path } = await params;
  const page = await client.getPage(path ?? [], { site, locale });

  // Cast route fields once to avoid repeated casting
  const routeFields = (page?.layout.sitecore.route?.fields ?? {}) as RouteFields;

  // Extract metadata values with fallbacks
  const metadataTitle = routeFields?.metadataTitle?.value?.toString();
  const pageTitle = routeFields?.pageTitle?.value?.toString();
  const title = routeFields?.Title?.value?.toString();
  const metadataDescription = routeFields?.metadataDescription?.value?.toString();
  const pageSummary = routeFields?.pageSummary?.value?.toString();
  const metadataKeywords = routeFields?.metadataKeywords?.value?.toString();
  const ogTitle = routeFields?.ogTitle?.value?.toString();
  const ogDescription = routeFields?.ogDescription?.value?.toString();
  const ogImageSrc = routeFields?.ogImage?.value?.src;
  const thumbnailImageSrc = routeFields?.thumbnailImage?.value?.src;

  // Build metadata with proper fallbacks
  const resolvedTitle = metadataTitle || pageTitle || title || 'Page';
  const resolvedDescription = metadataDescription || pageSummary || ogDescription || 'Sitecore Next.js Alaris Example';
  const resolvedOgTitle = ogTitle || resolvedTitle;
  const resolvedOgDescription = ogDescription || resolvedDescription;
  const resolvedImage = ogImageSrc || thumbnailImageSrc;

  return {
    title: resolvedTitle,
    description: resolvedDescription,
    keywords: metadataKeywords || undefined,
    openGraph: {
      type: 'website',
      title: resolvedOgTitle,
      description: resolvedOgDescription,
      url: url,
      siteName: site,
      images: resolvedImage || undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: resolvedOgTitle,
      description: resolvedOgDescription,
      images: resolvedImage || undefined,
    },
  };
};
