import { getRequestConfig, GetRequestConfigParams } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { routing } from './routing';
import client from 'src/lib/sitecore-client';
import { IntlErrorCode } from 'next-intl';

export default getRequestConfig(async ({ requestLocale }: GetRequestConfigParams) => {
  // Provide a static locale, fetch a user setting,
  // read from `cookies()`, `headers()`, etc.
  // Since this function is executed during the Server Components render pass, you can call functions like cookies() and headers() to return configuration that is request-specific. https://next-intl.dev/docs/usage/configuration

  // set by the catch-all route setRequestLocale
  // to support SSG and multisite here we expect both site and locale in the format {site}_{locale}
  const requested = await requestLocale;
  const [parsedSite, parsedLocale] = requested?.split('_') || [];
  const locale = hasLocale(routing.locales, parsedLocale) ? parsedLocale : routing.defaultLocale;

  const messages = await client.getDictionary({
    locale,
    site: parsedSite,
  });
  // Filter out dictionary entries where the value equals the key
  // This happens when Sitecore returns keys as values for missing dictionary items
  const filteredMessages: Record<string, string> = {};
  if (messages) {
    Object.entries(messages).forEach(([key, value]) => {
      // Only include if value is different from key (actual translation exists)
      if (value && value !== key) {
        filteredMessages[key] = value;
      }
    });
  }
  
  return {
    locale,
    messages: filteredMessages,
    // Suppress errors for missing translations
    onError(error) {
      if (error.code === IntlErrorCode.MISSING_MESSAGE) {
        // Log in development for debugging
        if (process.env.NODE_ENV === 'development') {
          console.warn(`Missing translation: ${error.message}`);
        }
        // Don't throw, just suppress the error
      } else {
        // Log other errors
        console.error(error);
      }
    },
    // Return empty string for missing translations to enable fallback values
    getMessageFallback({ key }) {
      const path = [key].flat().join('.');

      // Log missing translations in development for debugging
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[i18n] Missing translation key: "${path}" - using fallback`);
      }

      // Return empty string so || operator in components uses the fallback
      return '';
    },
  };
});
