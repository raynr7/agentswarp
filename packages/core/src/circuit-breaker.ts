import type { ToolResult, ToolContext } from './types';

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerConfig {
  failureThreshold?: number;
  resetTimeout?: number;
  retryAttempts?: number;
  retryBaseDelay?: number;
}

export interface CircuitStats {
  state: CircuitState;
  failures: number;
  totalCalls: number;
  successes: number;
  rejections: number;
  lastFailureTime: number | null;
  lastStateChange: number;
}

interface ToolCircuitData {
  state: CircuitState;
  failures: number;
  totalCalls: number;
  successes: number;
  rejections: number;
  lastFailureTime: number | null;
  lastStateChange: number;
  halfOpenInProgress: boolean;
}

const DEFAULT_FAILURE_THRESHOLD = 5;
const DEFAULT_RESET_TIMEOUT = 60_000;
const DEFAULT_RETRY_ATTEMPTS = 3;
const DEFAULT_RETRY_BASE_DELAY = 1_000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class CircuitBreaker {
  private readonly failureThreshold: number;
  private readonly resetTimeout: number;
  private readonly retryAttempts: number;
  private readonly retryBaseDelay: number;
  private readonly circuits: Map<string, ToolCircuitData> = new Map();

  constructor(config: CircuitBreakerConfig = {}) {
    this.failureThreshold = config.failureThreshold ?? DEFAULT_FAILURE_THRESHOLD;
    this.resetTimeout = config.resetTimeout ?? DEFAULT_RESET_TIMEOUT;
    this.retryAttempts = config.retryAttempts ?? DEFAULT_RETRY_ATTEMPTS;
    this.retryBaseDelay = config.retryBaseDelay ?? DEFAULT_RETRY_BASE_DELAY;
  }

  private getOrCreateCircuit(toolName: string): ToolCircuitData {
    if (!this.circuits.has(toolName)) {
      this.circuits.set(toolName, {
        state: 'CLOSED',
        failures: 0,
        totalCalls: 0,
        successes: 0,
        rejections: 0,
        lastFailureTime: null,
        lastStateChange: Date.now(),
        halfOpenInProgress: false,
      });
    }
    return this.circuits.get(toolName)!;
  }

  private transitionTo(circuit: ToolCircuitData, state: CircuitState): void {
    circuit.state = state;
    circuit.lastStateChange = Date.now();
    if (state === 'CLOSED') {
      circuit.failures = 0;
      circuit.halfOpenInProgress = false;
    } else if (state === 'OPEN') {
      circuit.halfOpenInProgress = false;
    } else if (state === 'HALF_OPEN') {
      circuit.halfOpenInProgress = false;
    }
  }

  private checkAndMaybeTransitionToHalfOpen(circuit: ToolCircuitData): void {
    if (
      circuit.state === 'OPEN' &&
      circuit.lastFailureTime !== null &&
      Date.now() - circuit.lastFailureTime >= this.resetTimeout
    ) {
      this.transitionTo(circuit, 'HALF_OPEN');
    }
  }

  getState(toolName: string): CircuitState {
    const circuit = this.getOrCreateCircuit(toolName);
    this.checkAndMaybeTransitionToHalfOpen(circuit);
    return circuit.state;
  }

  reset(toolName: string): void {
    const circuit = this.getOrCreateCircuit(toolName);
    this.transitionTo(circuit, 'CLOSED');
    circuit.lastFailureTime = null;
  }

  getStats(): Record<string, CircuitStats> {
    const result: Record<string, CircuitStats> = {};
    for (const [toolName, circuit] of this.circuits.entries()) {
      this.checkAndMaybeTransitionToHalfOpen(circuit);
      result[toolName] = {
        state: circuit.state,
        failures: circuit.failures,
        totalCalls: circuit.totalCalls,
        successes: circuit.successes,
        rejections: circuit.rejections,
        lastFailureTime: circuit.lastFailureTime,
        lastStateChange: circuit.lastStateChange,
      };
    }
    return result;
  }

  async execute<T>(toolName: string, fn: () => Promise<T>): Promise<T> {
    const circuit = this.getOrCreateCircuit(toolName);
    this.checkAndMaybeTransitionToHalfOpen(circuit);

    circuit.totalCalls++;

    if (circuit.state === 'OPEN') {
      circuit.rejections++;
      throw new CircuitBreakerOpenError(
        `Circuit breaker is OPEN for tool "${toolName}". Calls are being rejected.`
      );
    }

    if (circuit.state === 'HALF_OPEN') {
      if (circuit.halfOpenInProgress) {
        circuit.rejections++;
        throw new CircuitBreakerOpenError(
          `Circuit breaker is HALF_OPEN for tool "${toolName}" and a test call is already in progress.`
        );
      }
      circuit.halfOpenInProgress = true;
    }

    let lastError: unknown;

    for (let attempt = 0; attempt <= this.retryAttempts; attempt++) {
      if (attempt > 0) {
        const delay = this.retryBaseDelay * Math.pow(3, attempt - 1);
        await sleep(delay);
      }

      try {
        const result = await fn();

        circuit.successes++;

        if (circuit.state === 'HALF_OPEN') {
          this.transitionTo(circuit, 'CLOSED');
        } else if (circuit.state === 'CLOSED') {
          circuit.failures = 0;
        }

        return result;
      } catch (err) {
        lastError = err;

        if (attempt < this.retryAttempts) {
          continue;
        }

        circuit.failures++;
        circuit.lastFailureTime = Date.now();

        if (circuit.state === 'HALF_OPEN') {
          this.transitionTo(circuit, 'OPEN');
        } else if (
          circuit.state === 'CLOSED' &&
          circuit.failures >= this.failureThreshold
        ) {
          this.transitionTo(circuit, 'OPEN');
        }

        break;
      }
    }

    if (circuit.state === 'HALF_OPEN') {
      circuit.halfOpenInProgress = false;
    }

    throw lastError;
  }
}

export class CircuitBreakerOpenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CircuitBreakerOpenError';
  }
}

export function withCircuitBreaker<TArgs extends unknown[], TReturn>(
  toolName: string,
  fn: (...args: TArgs) => Promise<TReturn>,
  circuitBreaker: CircuitBreaker = globalCircuitBreaker
): (...args: TArgs) => Promise<TReturn> {
  return async (...args: TArgs): Promise<TReturn> => {
    return circuitBreaker.execute(toolName, () => fn(...args));
  };
}

export const globalCircuitBreaker = new CircuitBreaker();
