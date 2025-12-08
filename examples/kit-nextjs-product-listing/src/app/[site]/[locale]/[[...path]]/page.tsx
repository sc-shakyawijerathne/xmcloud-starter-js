import { isDesignLibraryPreviewData } from '@sitecore-content-sdk/nextjs/editing';
import { notFound } from 'next/navigation';
import { draftMode, headers } from 'next/headers';
import { SiteInfo } from '@sitecore-content-sdk/nextjs';
import sites from '.sitecore/sites.json';
import { routing } from 'src/i18n/routing';
import scConfig from 'sitecore.config';
import client from 'src/lib/sitecore-client';
import Layout, { RouteFields } from 'src/Layout';
import components from '.sitecore/component-map';
import Providers from 'src/Providers';
import { setRequestLocale, getMessages } from 'next-intl/server';

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

  // Set site and locale to be available in src/i18n/request.ts for fetching the dictionary
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

  // If the page is not found, return a 404
  if (!page) {
    notFound();
  }

  // Fetch the component data from Sitecore (Likely will be deprecated)
  const componentProps = await client.getComponentData(page.layout, {}, components);

  // Get messages for client components
  const messages = await getMessages();

  return (
    <Providers page={page} componentProps={componentProps} locale={locale} messages={messages}>
      <Layout page={page} />
    </Providers>
  );
}
// This function gets called at build and export time to determine
// pages for SSG ("paths", as tokenized array).
export const generateStaticParams = async () => {
  if (process.env.NODE_ENV !== 'development' && scConfig.generateStaticPaths) {
    return await client.getAppRouterStaticParams(
      sites.map((site: SiteInfo) => site.name),
      routing.locales.slice()
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
  const { path, site, locale } = await params;

  // The same call as for rendering the page. Should be cached by default react behavior
  const page = await client.getPage(path ?? [], { site, locale });
  // Cast route fields once to the expected RouteFields shape to avoid accessing unknown {}
  const routeFields = (page?.layout.sitecore.route?.fields ?? {}) as RouteFields;

  const metadataTitle = routeFields?.metadataTitle?.value?.toString();
  const pageTitle = routeFields?.pageTitle?.value?.toString();
  const ogDescription = routeFields?.ogDescription?.value?.toString();
  const description = routeFields?.metadataDescription?.value?.toString();
  const ogTitle = routeFields?.ogTitle?.value?.toString();
  const ogImageSrc = routeFields?.ogImage?.value?.src;

  return {
    title: metadataTitle || pageTitle || 'Page',
    description: ogDescription || description || 'SYNC',
    openGraph: {
      title: ogTitle || 'Page',
      type: 'website',
      description: ogDescription || description || 'SYNC',
      url: url,
      images:
        ogImageSrc ||
        'https://edge.sitecorecloud.io/sitecoresaa60dc-chahcontentabf6-maina179-91b6/media/Feature/JSS-Experience-Accelerator/Basic-Site/banner-image.jpg?h=2001&iar=0&w=3000',
    },
    
  };
};

