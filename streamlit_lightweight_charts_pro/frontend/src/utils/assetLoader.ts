/**
 * React 19 Asset Loading optimization for chart resources
 * Implements intelligent preloading, caching, and resource prioritization
 */

import { useCallback } from 'react';
import { chartScheduler } from './chartScheduler';
import { react19Monitor } from './react19PerformanceMonitor';
import { logger } from './logger';
import { Singleton } from './SingletonBase';

export type AssetType = 'script' | 'style' | 'image' | 'font' | 'data' | 'worker';
export type AssetPriority = 'critical' | 'high' | 'medium' | 'low';

export interface AssetDescriptor {
  id: string;
  type: AssetType;
  url: string;
  priority: AssetPriority;
  crossOrigin?: 'anonymous' | 'use-credentials';
  integrity?: string;
  preload?: boolean;
  prefetch?: boolean;
  size?: number;
  dependencies?: string[];
}

export interface AssetLoadResult {
  asset: AssetDescriptor;
  loadTime: number;
  fromCache: boolean;
  success: boolean;
  error?: Error;
}

/**
 * Enhanced Asset Loader with React 19 optimizations
 */
@Singleton()
class ChartAssetLoader {
  static getInstance: () => ChartAssetLoader;

  private loadedAssets: Map<string, any> = new Map();
  private loadingPromises: Map<string, Promise<AssetLoadResult>> = new Map();
  private preloadedAssets: Set<string> = new Set();
  private assetMetrics: Map<string, AssetLoadResult> = new Map();

  /**
   * Load an asset with intelligent caching and prioritization
   */
  async loadAsset(asset: AssetDescriptor): Promise<AssetLoadResult> {
    // Check if already loaded
    if (this.loadedAssets.has(asset.id)) {
      return {
        asset,
        loadTime: 0,
        fromCache: true,
        success: true,
      };
    }

    // Check if currently loading
    if (this.loadingPromises.has(asset.id)) {
      return this.loadingPromises.get(asset.id) as Promise<AssetLoadResult>;
    }

    // Start loading
    const loadPromise = this.performAssetLoad(asset);
    this.loadingPromises.set(asset.id, loadPromise);

    return loadPromise;
  }

  /**
   * Preload critical chart assets
   */
  preloadCriticalAssets(assets: AssetDescriptor[]): Promise<AssetLoadResult[]> {
    const criticalAssets = assets
      .filter(asset => asset.priority === 'critical' || asset.preload)
      .sort((a, b) => this.getPriorityWeight(a.priority) - this.getPriorityWeight(b.priority));

    return Promise.all(criticalAssets.map(asset => this.loadAsset(asset)));
  }

  /**
   * Prefetch assets for future use
   */
  prefetchAssets(assets: AssetDescriptor[]): void {
    const prefetchableAssets = assets.filter(asset => asset.prefetch);

    // Use scheduler for low-priority prefetching
    prefetchableAssets.forEach(asset => {
      chartScheduler.scheduleBackgroundProcessing(`prefetch-${asset.id}`, async () => {
        try {
          await this.loadAsset(asset);
          this.preloadedAssets.add(asset.id);

          if (process.env.NODE_ENV === 'development') {
            logger.debug(`Asset ${asset.id} preloaded successfully`, 'AssetLoader');
          }
        } catch (error) {
          logger.error('Asset priority update failed', 'AssetLoader', error);
        }
      });
    });
  }

  /**
   * Load chart-specific assets with dependency resolution
   */
  async loadChartAssets(chartId: string, assets: AssetDescriptor[]): Promise<AssetLoadResult[]> {
    const transitionId = react19Monitor.startTransition(`AssetLoad-${chartId}`, 'chart');

    try {
      // Resolve dependencies first
      const sortedAssets = this.resolveDependencies(assets);

      // Load assets in batches based on priority
      const criticalAssets = sortedAssets.filter(a => a.priority === 'critical');
      const highPriorityAssets = sortedAssets.filter(a => a.priority === 'high');
      const mediumPriorityAssets = sortedAssets.filter(a => a.priority === 'medium');
      const lowPriorityAssets = sortedAssets.filter(a => a.priority === 'low');

      // Load critical assets immediately
      const criticalResults = await Promise.all(
        criticalAssets.map(asset => this.loadAsset(asset))
      );

      // Load high-priority assets
      const highResults = await Promise.all(
        highPriorityAssets.map(asset => this.loadAsset(asset))
      );

      // Schedule medium and low priority assets
      const mediumResults = await this.scheduleAssetBatch(mediumPriorityAssets, 'normal');
      const lowResults = await this.scheduleAssetBatch(lowPriorityAssets, 'low');

      const allResults = [...criticalResults, ...highResults, ...mediumResults, ...lowResults];

      react19Monitor.endTransition(transitionId);

      if (process.env.NODE_ENV === 'development') {
        const totalTime = allResults.reduce((sum, result) => sum + result.loadTime, 0);
        const fromCache = allResults.filter(r => r.fromCache).length;
        logger.debug(`Asset loading completed`, 'AssetLoader', {
          totalTime: `${totalTime.toFixed(2)}ms`,
          fromCache: `${fromCache}/${allResults.length}`,
          failed: allResults.filter(r => !r.success).length,
        });
      }

      return allResults;

    } catch (error) {
      react19Monitor.endTransition(transitionId);
      throw error;
    }
  }

  /**
   * Get asset loading metrics
   */
  getLoadingMetrics(): {
    totalAssets: number;
    cachedAssets: number;
    preloadedAssets: number;
    averageLoadTime: number;
    failedAssets: number;
  } {
    const metrics = Array.from(this.assetMetrics.values());
    const totalTime = metrics.reduce((sum, metric) => sum + metric.loadTime, 0);
    const failedAssets = metrics.filter(m => !m.success).length;

    return {
      totalAssets: this.loadedAssets.size,
      cachedAssets: metrics.filter(m => m.fromCache).length,
      preloadedAssets: this.preloadedAssets.size,
      averageLoadTime: metrics.length > 0 ? totalTime / metrics.length : 0,
      failedAssets,
    };
  }

  /**
   * Clear asset cache
   */
  clearCache(): void {
    this.loadedAssets.clear();
    this.loadingPromises.clear();
    this.preloadedAssets.clear();
    this.assetMetrics.clear();
  }

  /**
   * Perform the actual asset loading
   */
  private async performAssetLoad(asset: AssetDescriptor): Promise<AssetLoadResult> {
    const startTime = performance.now();

    try {
      let loadedAsset: any;

      switch (asset.type) {
        case 'script':
          loadedAsset = await this.loadScript(asset);
          break;
        case 'style':
          loadedAsset = await this.loadStylesheet(asset);
          break;
        case 'image':
          loadedAsset = await this.loadImage(asset);
          break;
        case 'font':
          loadedAsset = await this.loadFont(asset);
          break;
        case 'data':
          loadedAsset = await this.loadData(asset);
          break;
        case 'worker':
          loadedAsset = await this.loadWorker(asset);
          break;
        default:
          throw new Error(`Unsupported asset type: ${asset.type}`);
      }

      const loadTime = performance.now() - startTime;
      const result: AssetLoadResult = {
        asset,
        loadTime,
        fromCache: false,
        success: true,
      };

      this.loadedAssets.set(asset.id, loadedAsset);
      this.assetMetrics.set(asset.id, result);
      this.loadingPromises.delete(asset.id);

      return result;

    } catch (error) {
      const loadTime = performance.now() - startTime;
      const result: AssetLoadResult = {
        asset,
        loadTime,
        fromCache: false,
        success: false,
        error: error as Error,
      };

      this.assetMetrics.set(asset.id, result);
      this.loadingPromises.delete(asset.id);

      throw result;
    }
  }

  /**
   * Load JavaScript asset
   */
  private loadScript(asset: AssetDescriptor): Promise<HTMLScriptElement> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = asset.url;
      script.async = true;

      if (asset.crossOrigin) {
        script.crossOrigin = asset.crossOrigin;
      }

      if (asset.integrity) {
        script.integrity = asset.integrity;
      }

      script.onload = () => resolve(script);
      script.onerror = () => reject(new Error(`Failed to load script: ${asset.url}`));

      document.head.appendChild(script);
    });
  }

  /**
   * Load CSS stylesheet
   */
  private loadStylesheet(asset: AssetDescriptor): Promise<HTMLLinkElement> {
    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = asset.url;

      if (asset.crossOrigin) {
        link.crossOrigin = asset.crossOrigin;
      }

      if (asset.integrity) {
        link.integrity = asset.integrity;
      }

      link.onload = () => resolve(link);
      link.onerror = () => reject(new Error(`Failed to load stylesheet: ${asset.url}`));

      document.head.appendChild(link);
    });
  }

  /**
   * Load image asset
   */
  private loadImage(asset: AssetDescriptor): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();

      if (asset.crossOrigin) {
        img.crossOrigin = asset.crossOrigin;
      }

      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load image: ${asset.url}`));

      img.src = asset.url;
    });
  }

  /**
   * Load font asset
   */
  private async loadFont(asset: AssetDescriptor): Promise<FontFace> {
    if (!('FontFace' in window)) {
      throw new Error('FontFace API not supported');
    }

    const font = new FontFace(asset.id, `url(${asset.url})`);
    const loadedFont = await font.load();
    document.fonts.add(loadedFont);
    return loadedFont;
  }

  /**
   * Load data asset (JSON, etc.)
   */
  private async loadData(asset: AssetDescriptor): Promise<any> {
    const response = await fetch(asset.url);
    if (!response.ok) {
      throw new Error(`Failed to load data: ${asset.url} (${response.status})`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      return response.json();
    } else {
      return response.text();
    }
  }

  /**
   * Load web worker
   */
  private async loadWorker(asset: AssetDescriptor): Promise<Worker> {
    try {
      const worker = new Worker(asset.url);
      return worker;
    } catch (error) {
      logger.error('Worker loading failed', 'AssetLoader', error);
      throw new Error(`Failed to load worker: ${asset.url}`);
    }
  }

  /**
   * Resolve asset dependencies
   */
  private resolveDependencies(assets: AssetDescriptor[]): AssetDescriptor[] {
    const assetMap = new Map(assets.map(asset => [asset.id, asset]));
    const visited = new Set<string>();
    const result: AssetDescriptor[] = [];

    const visit = (assetId: string) => {
      if (visited.has(assetId)) return;
      visited.add(assetId);

      const asset = assetMap.get(assetId);
      if (!asset) return;

      // Visit dependencies first
      asset.dependencies?.forEach(depId => visit(depId));

      result.push(asset);
    };

    assets.forEach(asset => visit(asset.id));
    return result;
  }

  /**
   * Schedule asset loading in batches
   */
  private async scheduleAssetBatch(
    assets: AssetDescriptor[],
    priority: 'normal' | 'low'
  ): Promise<AssetLoadResult[]> {
    const results: AssetLoadResult[] = [];

    for (const asset of assets) {
      chartScheduler.scheduleTask({
        id: `load-asset-${asset.id}`,
        name: `Load Asset: ${asset.id}`,
        priority: priority,
        callback: async () => {
          const result = await this.loadAsset(asset);
          results.push(result);
        },
        estimatedDuration: asset.size ? asset.size / 1000 : 50, // Estimate based on size
      });
    }

    // Wait for all assets to load
    while (results.length < assets.length) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    return results;
  }

  /**
   * Get priority weight for sorting
   */
  private getPriorityWeight(priority: AssetPriority): number {
    switch (priority) {
      case 'critical': return 1;
      case 'high': return 2;
      case 'medium': return 3;
      case 'low': return 4;
      default: return 3;
    }
  }
}

// Singleton instance
export const assetLoader = ChartAssetLoader.getInstance();

/**
 * React hook for asset loading
 */
export function useAssetLoader(chartId: string) {
  const loadAssets = useCallback(
    (assets: AssetDescriptor[]) => {
      return assetLoader.loadChartAssets(chartId, assets);
    },
    [chartId]
  );

  const preloadAssets = useCallback(
    (assets: AssetDescriptor[]) => {
      return assetLoader.preloadCriticalAssets(assets);
    },
    []
  );

  const prefetchAssets = useCallback(
    (assets: AssetDescriptor[]) => {
      assetLoader.prefetchAssets(assets);
    },
    []
  );

  return {
    loadAssets,
    preloadAssets,
    prefetchAssets,
    getMetrics: () => assetLoader.getLoadingMetrics(),
    clearCache: () => assetLoader.clearCache(),
  };
}

/**
 * Common chart assets configuration
 */
export const ChartAssets = {
  lightweightCharts: {
    id: 'lightweight-charts',
    type: 'script' as AssetType,
    url: 'https://unpkg.com/lightweight-charts/dist/lightweight-charts.standalone.production.js',
    priority: 'critical' as AssetPriority,
    preload: true,
    integrity: 'sha384-...', // Add actual integrity hash
  },

  chartStyles: {
    id: 'chart-styles',
    type: 'style' as AssetType,
    url: '/assets/chart-styles.css',
    priority: 'high' as AssetPriority,
    preload: true,
  },

  chartWorker: {
    id: 'chart-worker',
    type: 'worker' as AssetType,
    url: '/assets/chart-worker.js',
    priority: 'medium' as AssetPriority,
    prefetch: true,
  },
} as const;
