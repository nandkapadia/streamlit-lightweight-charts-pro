/**
 * React 19 Scheduler integration for optimized chart rendering
 * Provides intelligent task scheduling and priority management
 */

import { useCallback } from 'react';

import {
  unstable_scheduleCallback as scheduleCallback,
  unstable_cancelCallback as cancelCallback,
  unstable_shouldYield as shouldYield,
  unstable_now as now,
  // unstable_getCurrentPriorityLevel as getCurrentPriorityLevel,
  unstable_ImmediatePriority as ImmediatePriority,
  unstable_UserBlockingPriority as UserBlockingPriority,
  unstable_NormalPriority as NormalPriority,
  unstable_LowPriority as LowPriority,
  unstable_IdlePriority as IdlePriority,
} from 'scheduler';

import { react19Monitor } from './react19PerformanceMonitor';
import { logger } from './logger';

export type TaskPriority = 'immediate' | 'user-blocking' | 'normal' | 'low' | 'idle';

export interface ChartTask {
  id: string;
  name: string;
  priority: TaskPriority;
  callback: () => void | Promise<void>;
  chartId?: string;
  estimatedDuration?: number;
  dependencies?: string[];
}

export interface TaskMetrics {
  totalTasks: number;
  completedTasks: number;
  averageDuration: number;
  tasksByPriority: Record<TaskPriority, number>;
}

/**
 * Advanced Chart Task Scheduler with React 19 optimizations
 */
class ChartScheduler {
  private static instance: ChartScheduler;
  private taskQueue: Map<string, ChartTask> = new Map();
  private scheduledCallbacks: Map<string, any> = new Map();
  private runningTasks: Set<string> = new Set();
  private completedTasks: Set<string> = new Set();
  private taskMetrics: Map<string, { startTime: number; endTime?: number }> = new Map();

  static getInstance(): ChartScheduler {
    if (!ChartScheduler.instance) {
      ChartScheduler.instance = new ChartScheduler();
    }
    return ChartScheduler.instance;
  }

  /**
   * Schedule a chart-related task with priority
   */
  scheduleTask(task: ChartTask): string {
    this.taskQueue.set(task.id, task);

    const schedulerPriority = this.getSchedulerPriority(task.priority);
    const wrappedCallback = this.createTaskWrapper(task);

    const callbackId = scheduleCallback(schedulerPriority, wrappedCallback);
    this.scheduledCallbacks.set(task.id, callbackId);

    if (process.env.NODE_ENV === 'development') {
      logger.debug(`Task ${task.name} scheduled with ID: ${task.id}`, 'ChartScheduler');
    }

    return task.id;
  }

  /**
   * Cancel a scheduled task
   */
  cancelTask(taskId: string): boolean {
    const callbackId = this.scheduledCallbacks.get(taskId);
    if (callbackId) {
      cancelCallback(callbackId);
      this.scheduledCallbacks.delete(taskId);
      this.taskQueue.delete(taskId);
      this.runningTasks.delete(taskId);

      if (process.env.NODE_ENV === 'development') {
        logger.debug(`Task ${taskId} cancelled successfully`, 'ChartScheduler');
      }

      return true;
    }
    return false;
  }

  /**
   * Schedule high-priority chart updates
   */
  scheduleImmediateChartUpdate(chartId: string, updateCallback: () => void): string {
    const taskId = `immediate-update-${chartId}-${Date.now()}`;
    return this.scheduleTask({
      id: taskId,
      name: `Immediate Chart Update - ${chartId}`,
      priority: 'immediate',
      callback: updateCallback,
      chartId,
      estimatedDuration: 16, // 1 frame
    });
  }

  /**
   * Schedule user interaction responses
   */
  scheduleUserInteraction(chartId: string, interactionCallback: () => void): string {
    const taskId = `interaction-${chartId}-${Date.now()}`;
    return this.scheduleTask({
      id: taskId,
      name: `User Interaction - ${chartId}`,
      priority: 'user-blocking',
      callback: interactionCallback,
      chartId,
      estimatedDuration: 5, // Very fast response
    });
  }

  /**
   * Schedule background chart processing
   */
  scheduleBackgroundProcessing(chartId: string, processingCallback: () => void): string {
    const taskId = `background-${chartId}-${Date.now()}`;
    return this.scheduleTask({
      id: taskId,
      name: `Background Processing - ${chartId}`,
      priority: 'low',
      callback: processingCallback,
      chartId,
      estimatedDuration: 100, // Can take longer
    });
  }

  /**
   * Schedule idle-time optimization tasks
   */
  scheduleIdleOptimization(optimizationCallback: () => void): string {
    const taskId = `idle-optimization-${Date.now()}`;
    return this.scheduleTask({
      id: taskId,
      name: 'Idle Optimization',
      priority: 'idle',
      callback: optimizationCallback,
      estimatedDuration: 50,
    });
  }

  /**
   * Batch multiple chart operations
   */
  scheduleBatchOperation(
    chartIds: string[],
    batchCallback: (chartId: string) => void,
    priority: TaskPriority = 'normal'
  ): string[] {
    const taskIds: string[] = [];

    chartIds.forEach((chartId, index) => {
      const taskId = `batch-${chartId}-${Date.now()}-${index}`;
      taskIds.push(
        this.scheduleTask({
          id: taskId,
          name: `Batch Operation - ${chartId}`,
          priority,
          callback: () => batchCallback(chartId),
          chartId,
          estimatedDuration: 20,
        })
      );
    });

    return taskIds;
  }

  /**
   * Create a time-sliced task for large operations
   */
  scheduleTimeSlicedTask(
    name: string,
    workFunction: () => boolean, // Returns true when more work is needed
    priority: TaskPriority = 'normal'
  ): string {
    const taskId = `time-sliced-${Date.now()}`;

    const performWork = () => {
      const deadline = now() + 5; // Work for 5ms at a time

      while (now() < deadline && !shouldYield()) {
        const hasMoreWork = workFunction();
        if (!hasMoreWork) {
          return; // Work is done
        }
      }

      // Request paint to ensure smooth rendering (using requestAnimationFrame as fallback)
      requestAnimationFrame(() => {});

      // Schedule continuation if we yielded
      this.scheduleTask({
        id: `${taskId}-continue-${Date.now()}`,
        name: `${name} (continued)`,
        priority,
        callback: performWork,
        estimatedDuration: 5,
      });
    };

    return this.scheduleTask({
      id: taskId,
      name,
      priority,
      callback: performWork,
      estimatedDuration: 5,
    });
  }

  /**
   * Get current task metrics
   */
  getTaskMetrics(): TaskMetrics {
    const tasksByPriority: Record<TaskPriority, number> = {
      immediate: 0,
      'user-blocking': 0,
      normal: 0,
      low: 0,
      idle: 0,
    };

    let totalDuration = 0;
    let completedWithDuration = 0;

    for (const task of this.taskQueue.values()) {
      tasksByPriority[task.priority]++;
    }

    for (const [, metrics] of this.taskMetrics.entries()) {
      if (metrics.endTime) {
        totalDuration += metrics.endTime - metrics.startTime;
        completedWithDuration++;
      }
    }

    return {
      totalTasks: this.taskQueue.size,
      completedTasks: this.completedTasks.size,
      averageDuration: completedWithDuration > 0 ? totalDuration / completedWithDuration : 0,
      tasksByPriority,
    };
  }

  /**
   * Clear all scheduled tasks for a specific chart
   */
  clearChartTasks(chartId: string): number {
    let cancelledCount = 0;

    for (const [taskId, task] of this.taskQueue.entries()) {
      if (task.chartId === chartId) {
        if (this.cancelTask(taskId)) {
          cancelledCount++;
        }
      }
    }

    return cancelledCount;
  }

  /**
   * Get scheduler priority level
   */
  private getSchedulerPriority(priority: TaskPriority) {
    switch (priority) {
      case 'immediate':
        return ImmediatePriority;
      case 'user-blocking':
        return UserBlockingPriority;
      case 'normal':
        return NormalPriority;
      case 'low':
        return LowPriority;
      case 'idle':
        return IdlePriority;
      default:
        return NormalPriority;
    }
  }

  /**
   * Create a wrapped task callback with monitoring
   */
  private createTaskWrapper(task: ChartTask) {
    return () => {
      const startTime = now();
      this.runningTasks.add(task.id);
      this.taskMetrics.set(task.id, { startTime });

      // Start monitoring
      const transitionId = react19Monitor.startTransition(`Task-${task.name}`, 'chart');

      const executeTask = async () => {
        try {
          // Check dependencies
          if (task.dependencies) {
            const unmetDependencies = task.dependencies.filter(dep =>
              !this.completedTasks.has(dep)
            );

            if (unmetDependencies.length > 0) {
              // Reschedule for later
              setTimeout(() => {
                this.scheduleTask(task);
              }, 10);
              return;
            }
          }

          // Execute the task
          await task.callback();

          const endTime = now();
          const duration = endTime - startTime;

          // Update metrics
          const metrics = this.taskMetrics.get(task.id);
          if (metrics) {
            metrics.endTime = endTime;
          }

          this.completedTasks.add(task.id);
          this.runningTasks.delete(task.id);
          this.taskQueue.delete(task.id);
          this.scheduledCallbacks.delete(task.id);

          // End monitoring
          react19Monitor.endTransition(transitionId);

          // Log task completion in development
          if (process.env.NODE_ENV === 'development') {
            const status = duration > (task.estimatedDuration || 20) ? '⚠️ SLOW' : '✅ FAST';
            logger.debug(`Task ${task.name} completed: ${status}`, 'ChartScheduler');
          }

          // Request paint for visual updates
          if (task.priority === 'immediate' || task.priority === 'user-blocking') {
            requestAnimationFrame(() => {});
          }

        } catch (error) {
          logger.error('Task execution failed in scheduler', 'ChartScheduler', error);
          react19Monitor.endTransition(transitionId);

          this.runningTasks.delete(task.id);
          this.taskQueue.delete(task.id);
          this.scheduledCallbacks.delete(task.id);
        }
      };

      // Execute the task asynchronously
      void executeTask();
    };
  }
}

// Singleton instance
export const chartScheduler = ChartScheduler.getInstance();

/**
 * React hook for easy scheduler integration
 */
export function useChartScheduler(chartId: string) {
  const scheduleUpdate = useCallback(
    (updateCallback: () => void) => {
      return chartScheduler.scheduleImmediateChartUpdate(chartId, updateCallback);
    },
    [chartId]
  );

  const scheduleInteraction = useCallback(
    (interactionCallback: () => void) => {
      return chartScheduler.scheduleUserInteraction(chartId, interactionCallback);
    },
    [chartId]
  );

  const scheduleBackground = useCallback(
    (processingCallback: () => void) => {
      return chartScheduler.scheduleBackgroundProcessing(chartId, processingCallback);
    },
    [chartId]
  );

  const clearTasks = useCallback(() => {
    return chartScheduler.clearChartTasks(chartId);
  }, [chartId]);

  return {
    scheduleUpdate,
    scheduleInteraction,
    scheduleBackground,
    clearTasks,
    getMetrics: () => chartScheduler.getTaskMetrics(),
  };
}

/**
 * Get scheduler performance metrics for monitoring
 */
export function getSchedulerMetrics(): TaskMetrics {
  return chartScheduler.getTaskMetrics();
}

/**
 * Log scheduler performance metrics to console
 */
export function logSchedulerMetrics(): void {
  if (process.env.NODE_ENV !== 'development') return;

  const metrics = chartScheduler.getTaskMetrics();
  logger.debug('Chart scheduler performance metrics', 'ChartScheduler', metrics);
}
