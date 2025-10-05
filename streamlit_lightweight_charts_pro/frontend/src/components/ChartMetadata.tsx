/**
 * React 19 Document Metadata management for chart components
 * Provides built-in SEO and meta tag management with dynamic updates
 */

import React, { useEffect, useMemo } from 'react';
import { react19Monitor } from '../utils/react19PerformanceMonitor';
import { logger } from '../utils/logger';

export interface ChartMetadata {
  title?: string;
  description?: string;
  keywords?: string[];
  author?: string;
  chartType?: string;
  dataPoints?: number;
  dateRange?: {
    start: string | number;
    end: string | number;
  };
  theme?: 'light' | 'dark';
  language?: string;
}

interface ChartMetadataProps {
  chartId: string;
  metadata: ChartMetadata;
  enableOpenGraph?: boolean;
  enableTwitterCard?: boolean;
  enableJsonLd?: boolean;
}

/**
 * React 19 Document Metadata Component
 * Manages document head with chart-specific metadata
 */
export const ChartMetadata: React.FC<ChartMetadataProps> = React.memo(
  ({
    chartId,
    metadata,
    enableOpenGraph = true,
    enableTwitterCard = true,
    enableJsonLd = true,
  }) => {
    // Computed metadata values
    const computedMetadata = useMemo(() => {
      const chartTitle = metadata.title || `Chart ${chartId}`;
      const fullTitle = `${chartTitle} - Interactive Financial Chart`;

      const description =
        metadata.description ||
        `Interactive ${metadata.chartType || 'financial'} chart with ${metadata.dataPoints || 'multiple'} data points. ` +
          `Built with React 19 and Lightweight Charts.`;

      const keywords = [
        'chart',
        'financial',
        'interactive',
        'trading',
        'data visualization',
        'react',
        'typescript',
        ...(metadata.keywords || []),
      ].join(', ');

      const dateRange = metadata.dateRange
        ? {
            start:
              typeof metadata.dateRange.start === 'number'
                ? new Date(metadata.dateRange.start).toISOString().split('T')[0]
                : metadata.dateRange.start,
            end:
              typeof metadata.dateRange.end === 'number'
                ? new Date(metadata.dateRange.end).toISOString().split('T')[0]
                : metadata.dateRange.end,
          }
        : null;

      return {
        fullTitle,
        description,
        keywords,
        dateRange,
        author: metadata.author || 'Streamlit Lightweight Charts',
        language: metadata.language || 'en',
        theme: metadata.theme || 'light',
      };
    }, [chartId, metadata]);

    // Update document title and basic meta tags
    useEffect(() => {
      const transitionId = react19Monitor.startTransition(`MetadataUpdate-${chartId}`, 'sync');

      try {
        // Update document title
        const originalTitle = document.title;
        document.title = computedMetadata.fullTitle;

        // Update or create meta description
        let descriptionMeta = document.querySelector('meta[name="description"]');
        if (!descriptionMeta) {
          descriptionMeta = document.createElement('meta');
          descriptionMeta.setAttribute('name', 'description');
          document.head.appendChild(descriptionMeta);
        }
        descriptionMeta.setAttribute('content', computedMetadata.description);

        // Update or create meta keywords
        let keywordsMeta = document.querySelector('meta[name="keywords"]');
        if (!keywordsMeta) {
          keywordsMeta = document.createElement('meta');
          keywordsMeta.setAttribute('name', 'keywords');
          document.head.appendChild(keywordsMeta);
        }
        keywordsMeta.setAttribute('content', computedMetadata.keywords);

        // Update or create author meta
        let authorMeta = document.querySelector('meta[name="author"]');
        if (!authorMeta) {
          authorMeta = document.createElement('meta');
          authorMeta.setAttribute('name', 'author');
          document.head.appendChild(authorMeta);
        }
        authorMeta.setAttribute('content', computedMetadata.author);

        // Update language
        document.documentElement.lang = computedMetadata.language;

        // Update theme-color for mobile
        let themeColorMeta = document.querySelector('meta[name="theme-color"]');
        if (!themeColorMeta) {
          themeColorMeta = document.createElement('meta');
          themeColorMeta.setAttribute('name', 'theme-color');
          document.head.appendChild(themeColorMeta);
        }
        themeColorMeta.setAttribute(
          'content',
          computedMetadata.theme === 'dark' ? '#1a1a1a' : '#ffffff'
        );

        react19Monitor.endTransition(transitionId);

        // Cleanup function
        return () => {
          document.title = originalTitle;
        };
      } catch (error) {
        logger.error('Failed to update document metadata', 'ChartMetadata', error);
        react19Monitor.endTransition(transitionId);
        return () => {}; // Return cleanup function even on error
      }
    }, [chartId, computedMetadata]);

    // Open Graph meta tags
    const openGraphTags = useMemo(() => {
      if (!enableOpenGraph) return null;

      const ogTags = [
        { property: 'og:title', content: computedMetadata.fullTitle },
        { property: 'og:description', content: computedMetadata.description },
        { property: 'og:type', content: 'website' },
        { property: 'og:locale', content: computedMetadata.language },
        { property: 'og:site_name', content: 'Streamlit Lightweight Charts' },
      ];

      if (computedMetadata.dateRange) {
        ogTags.push(
          { property: 'article:published_time', content: computedMetadata.dateRange.start },
          { property: 'article:modified_time', content: computedMetadata.dateRange.end }
        );
      }

      return ogTags;
    }, [enableOpenGraph, computedMetadata]);

    // Twitter Card meta tags
    const twitterCardTags = useMemo(() => {
      if (!enableTwitterCard) return null;

      return [
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: computedMetadata.fullTitle },
        { name: 'twitter:description', content: computedMetadata.description },
        { name: 'twitter:creator', content: '@streamlit' },
        { name: 'twitter:site', content: '@streamlit' },
      ];
    }, [enableTwitterCard, computedMetadata]);

    // JSON-LD structured data
    const jsonLdData = useMemo(() => {
      if (!enableJsonLd) return null;

      const structuredData = {
        '@context': 'https://schema.org',
        '@type': 'Dataset',
        name: computedMetadata.fullTitle,
        description: computedMetadata.description,
        author: {
          '@type': 'Organization',
          name: computedMetadata.author,
        },
        dateCreated: computedMetadata.dateRange?.start,
        dateModified: computedMetadata.dateRange?.end,
        keywords: metadata.keywords,
        inLanguage: computedMetadata.language,
        ...(metadata.dataPoints && {
          measurementTechnique: `Interactive chart with ${metadata.dataPoints} data points`,
        }),
        ...(metadata.chartType && {
          variableMeasured: metadata.chartType,
        }),
      };

      return JSON.stringify(structuredData);
    }, [enableJsonLd, computedMetadata, metadata]);

    // Update meta tags effect
    useEffect(() => {
      const metaElements: HTMLMetaElement[] = [];

      // Add Open Graph tags
      if (openGraphTags) {
        openGraphTags.forEach(tag => {
          let metaElement = document.querySelector(
            `meta[property="${tag.property}"]`
          ) as HTMLMetaElement;
          if (!metaElement) {
            metaElement = document.createElement('meta');
            metaElement.setAttribute('property', tag.property);
            document.head.appendChild(metaElement);
            metaElements.push(metaElement);
          }
          metaElement.setAttribute('content', tag.content);
        });
      }

      // Add Twitter Card tags
      if (twitterCardTags) {
        twitterCardTags.forEach(tag => {
          let metaElement = document.querySelector(`meta[name="${tag.name}"]`) as HTMLMetaElement;
          if (!metaElement) {
            metaElement = document.createElement('meta');
            metaElement.setAttribute('name', tag.name);
            document.head.appendChild(metaElement);
            metaElements.push(metaElement);
          }
          metaElement.setAttribute('content', tag.content);
        });
      }

      // Add JSON-LD script
      let jsonLdScript: HTMLScriptElement | null = null;
      if (jsonLdData) {
        jsonLdScript = document.createElement('script');
        jsonLdScript.type = 'application/ld+json';
        jsonLdScript.textContent = jsonLdData;
        document.head.appendChild(jsonLdScript);
      }

      // Cleanup function
      return () => {
        metaElements.forEach(element => {
          if (element.parentNode) {
            element.parentNode.removeChild(element);
          }
        });

        if (jsonLdScript && jsonLdScript.parentNode) {
          jsonLdScript.parentNode.removeChild(jsonLdScript);
        }
      };
    }, [openGraphTags, twitterCardTags, jsonLdData]);

    // Development logging
    useEffect(() => {
      if (process.env.NODE_ENV === 'development') {
        logger.debug(`Metadata updated for chart ${chartId}`, 'ChartMetadata', {
          computedMetadata,
          enableOpenGraph,
          enableTwitterCard,
          enableJsonLd,
        });
      }
    }, [chartId, computedMetadata, enableOpenGraph, enableTwitterCard, enableJsonLd]);

    // This component doesn't render anything visible
    return null;
  }
);

ChartMetadata.displayName = 'ChartMetadata';

/**
 * Hook for dynamic metadata management
 */
export function useChartMetadata(chartId: string, initialMetadata: ChartMetadata) {
  const [metadata, setMetadata] = React.useState<ChartMetadata>(initialMetadata);

  const updateMetadata = React.useCallback((updates: Partial<ChartMetadata>) => {
    setMetadata(prev => ({
      ...prev,
      ...updates,
    }));
  }, []);

  const updateTitle = React.useCallback(
    (title: string) => {
      updateMetadata({ title });
    },
    [updateMetadata]
  );

  const updateDescription = React.useCallback(
    (description: string) => {
      updateMetadata({ description });
    },
    [updateMetadata]
  );

  const updateDataInfo = React.useCallback(
    (dataPoints: number, dateRange?: ChartMetadata['dateRange']) => {
      updateMetadata({
        dataPoints,
        ...(dateRange && { dateRange }),
      });
    },
    [updateMetadata]
  );

  const updateTheme = React.useCallback(
    (theme: 'light' | 'dark') => {
      updateMetadata({ theme });
    },
    [updateMetadata]
  );

  return {
    metadata,
    updateMetadata,
    updateTitle,
    updateDescription,
    updateDataInfo,
    updateTheme,
  };
}

/**
 * Prebuilt metadata configurations for common chart types
 */
export const ChartMetadataPresets = {
  candlestick: (chartId: string): ChartMetadata => ({
    title: `Candlestick Chart ${chartId}`,
    description:
      'Interactive candlestick chart showing price movements with OHLC data visualization.',
    keywords: ['candlestick', 'OHLC', 'trading', 'price action', 'technical analysis'],
    chartType: 'candlestick',
  }),

  line: (chartId: string): ChartMetadata => ({
    title: `Line Chart ${chartId}`,
    description: 'Clean line chart visualization for tracking trends and patterns over time.',
    keywords: ['line chart', 'trend', 'time series', 'data visualization'],
    chartType: 'line',
  }),

  area: (chartId: string): ChartMetadata => ({
    title: `Area Chart ${chartId}`,
    description: 'Area chart with filled regions showing volume and magnitude of changes.',
    keywords: ['area chart', 'filled', 'volume', 'magnitude'],
    chartType: 'area',
  }),

  histogram: (chartId: string): ChartMetadata => ({
    title: `Histogram Chart ${chartId}`,
    description: 'Histogram visualization showing data distribution and frequency analysis.',
    keywords: ['histogram', 'distribution', 'frequency', 'statistical analysis'],
    chartType: 'histogram',
  }),
} as const;
