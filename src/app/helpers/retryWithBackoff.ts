// Utility function for exponential backoff with max delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
  maxDelay: number = 5000,
  onRetriesExhausted?: () => T
): Promise<T> => {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        break;
      }

      // Calculate exponential backoff delay (1s, 2s, 4s, capped at 5s)
      const backoffDelay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
      await delay(backoffDelay);
    }
  }

  // If onRetriesExhausted returns a value, use it instead of throwing
  if (onRetriesExhausted) {
    return onRetriesExhausted();
  }

  throw lastError!;
};
