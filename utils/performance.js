/**
 * Performance monitoring utility
 */
class PerformanceMonitor {
  constructor() {
    this.operations = new Map();
    this.isEnabled = __DEV__; // Only enable in development
  }

  /**
   * Record the duration of an operation
   * @param {string} operationName - Name of the operation
   * @param {number} duration - Duration in milliseconds
   */
  recordOperation(operationName, duration) {
    if (!this.isEnabled) return;

    if (!this.operations.has(operationName)) {
      this.operations.set(operationName, {
        count: 0,
        totalTime: 0,
        maxTime: 0,
        minTime: Infinity,
        averageTime: 0,
      });
    }

    const stats = this.operations.get(operationName);
    stats.count++;
    stats.totalTime += duration;
    stats.maxTime = Math.max(stats.maxTime, duration);
    stats.minTime = Math.min(stats.minTime, duration);
    stats.averageTime = stats.totalTime / stats.count;

    // Log slow operations
    if (duration > 100) {
      console.warn(
        `Slow operation detected: ${operationName} took ${duration.toFixed(
          2
        )}ms`
      );
    }
  }

  /**
   * Get performance statistics for an operation
   * @param {string} operationName - Name of the operation
   * @returns {Object|null} - Performance statistics or null if not found
   */
  getStats(operationName) {
    return this.operations.get(operationName) || null;
  }

  /**
   * Get all performance statistics
   * @returns {Object} - All performance statistics
   */
  getAllStats() {
    const stats = {};
    this.operations.forEach((value, key) => {
      stats[key] = value;
    });
    return stats;
  }

  /**
   * Clear all performance statistics
   */
  clear() {
    this.operations.clear();
  }

  /**
   * Log performance summary to console
   */
  logSummary() {
    if (!this.isEnabled) return;

    console.group("Performance Summary");
    this.operations.forEach((stats, operationName) => {
      console.log(`${operationName}:`, {
        calls: stats.count,
        avg: `${stats.averageTime.toFixed(2)}ms`,
        max: `${stats.maxTime.toFixed(2)}ms`,
        min: `${stats.minTime.toFixed(2)}ms`,
        total: `${stats.totalTime.toFixed(2)}ms`,
      });
    });
    console.groupEnd();
  }

  /**
   * Measure data processing performance
   * @param {string} operationName - Name of the operation
   * @param {number} dataSize - Size of the data being processed
   * @param {Function} processingFunction - Function to execute
   * @returns {*} - Result of the processing function
   */
  measureDataProcessing(operationName, dataSize, processingFunction) {
    if (!this.isEnabled) return processingFunction();

    const startTime = performance.now();
    const result = processingFunction();
    const duration = performance.now() - startTime;

    this.recordOperation(operationName, duration);

    if (dataSize > 0) {
      const itemsPerSecond = Math.round((dataSize / duration) * 1000);
      console.log(
        `📈 ${operationName}: ${itemsPerSecond} items/second (${dataSize} items in ${duration.toFixed(
          2
        )}ms)`
      );
    }

    return result;
  }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Higher-order function to measure performance of async functions
 * @param {Function} fn - Function to measure
 * @param {string} operationName - Name for the operation
 * @returns {Function} - Wrapped function with performance monitoring
 */
export const withPerformanceMonitoring = (fn, operationName) => {
  return async (...args) => {
    const startTime = performance.now();
    try {
      const result = await fn(...args);
      performanceMonitor.recordOperation(
        operationName,
        performance.now() - startTime
      );
      return result;
    } catch (error) {
      performanceMonitor.recordOperation(
        `${operationName}_error`,
        performance.now() - startTime
      );
      throw error;
    }
  };
};

/**
 * Decorator for measuring React component render time
 * @param {React.Component} Component - Component to measure
 * @param {string} componentName - Name of the component
 * @returns {React.Component} - Wrapped component with performance monitoring
 */
export const withRenderPerformance = (Component, componentName) => {
  const React = require("react");

  return React.memo((props) => {
    const startTime = performance.now();

    React.useEffect(() => {
      performanceMonitor.recordOperation(
        `${componentName}_render`,
        performance.now() - startTime
      );
    });

    return React.createElement(Component, props);
  });
};
