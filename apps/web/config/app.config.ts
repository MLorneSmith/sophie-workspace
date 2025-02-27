import { z } from 'zod';

const production = process.env.NODE_ENV === 'production';
const isBuildTime = process.env.VERCEL || process.env.CI;

/**
 * Helper function to safely get environment variables with fallbacks during build
 * This ensures the app can build even if some environment variables are missing
 */
const getEnvVar = (name: string, fallback: string = '') => {
  const value = process.env[name];

  // During build time, use fallbacks if env vars are missing
  if (isBuildTime && (value === undefined || value === null || value === '')) {
    return fallback;
  }

  return value;
};

const AppConfigSchema = z
  .object({
    name: z
      .string({
        description: `This is the name of your SaaS. Ex. "Makerkit"`,
        required_error: `Please provide the variable NEXT_PUBLIC_PRODUCT_NAME`,
      })
      .min(1)
      .default('SlideHeroes'), // Default for build time
    title: z
      .string({
        description: `This is the default title tag of your SaaS.`,
        required_error: `Please provide the variable NEXT_PUBLIC_SITE_TITLE`,
      })
      .min(1)
      .default('SlideHeroes - AI Tools & Video Training'), // Default for build time
    description: z
      .string({
        description: `This is the default description of your SaaS.`,
        required_error: `Please provide the variable NEXT_PUBLIC_SITE_DESCRIPTION`,
      })
      .default('Rapidly Create Smart + Impactful Business Presentations'),
    url: z
      .string({
        required_error: `Please provide the variable NEXT_PUBLIC_SITE_URL`,
      })
      .url({
        message: `You are deploying a production build but have entered a NEXT_PUBLIC_SITE_URL variable using http instead of https. It is very likely that you have set the incorrect URL. The build will now fail to prevent you from from deploying a faulty configuration. Please provide the variable NEXT_PUBLIC_SITE_URL with a valid URL, such as: 'https://example.com'`,
      })
      .default('https://2025slideheroes-web.vercel.app'),
    locale: z
      .string({
        description: `This is the default locale of your SaaS.`,
        required_error: `Please provide the variable NEXT_PUBLIC_DEFAULT_LOCALE`,
      })
      .default('en'),
    theme: z.enum(['light', 'dark', 'system']).default('light'),
    production: z.boolean(),
    themeColor: z.string().default('#ffffff'),
    themeColorDark: z.string().default('#0a0a0a'),
  })
  .refine(
    (schema) => {
      const isCI = process.env.NEXT_PUBLIC_CI;

      if (isCI ?? !schema.production) {
        return true;
      }

      return !schema.url.startsWith('http:');
    },
    {
      message: `Please provide a valid HTTPS URL. Set the variable NEXT_PUBLIC_SITE_URL with a valid URL, such as: 'https://example.com'`,
      path: ['url'],
    },
  )
  .refine(
    (schema) => {
      return schema.themeColor !== schema.themeColorDark;
    },
    {
      message: `Please provide different theme colors for light and dark themes.`,
      path: ['themeColor'],
    },
  );

// Use the getEnvVar function to provide fallbacks during build time
const appConfig = AppConfigSchema.parse({
  name: getEnvVar('NEXT_PUBLIC_PRODUCT_NAME', 'SlideHeroes'),
  title: getEnvVar(
    'NEXT_PUBLIC_SITE_TITLE',
    'SlideHeroes - AI Tools & Video Training',
  ),
  description: getEnvVar(
    'NEXT_PUBLIC_SITE_DESCRIPTION',
    'Rapidly Create Smart + Impactful Business Presentations',
  ),
  url: getEnvVar(
    'NEXT_PUBLIC_SITE_URL',
    'https://2025slideheroes-web.vercel.app',
  ),
  locale: getEnvVar('NEXT_PUBLIC_DEFAULT_LOCALE', 'en'),
  theme: getEnvVar('NEXT_PUBLIC_DEFAULT_THEME_MODE', 'light'),
  themeColor: getEnvVar('NEXT_PUBLIC_THEME_COLOR', '#ffffff'),
  themeColorDark: getEnvVar('NEXT_PUBLIC_THEME_COLOR_DARK', '#0a0a0a'),
  production,
});

export default appConfig;
