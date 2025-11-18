/**
 * Error classes for @prachaya.dev5641/elysia-discord
 */

/**
 * Base error class for all Discord-related errors
 */
export class DiscordError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = "DiscordError";
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error thrown when signature verification fails
 */
export class SignatureVerificationError extends DiscordError {
  constructor(message: string = "Discord signature verification failed") {
    super(message, "SIGNATURE_VERIFICATION_FAILED");
    this.name = "SignatureVerificationError";
  }
}

/**
 * Error thrown when an interaction fails
 */
export class DiscordInteractionError extends DiscordError {
  constructor(
    message: string,
    public readonly interactionId?: string,
    public readonly interactionType?: string
  ) {
    super(message, "INTERACTION_ERROR");
    this.name = "DiscordInteractionError";
  }
}

/**
 * Error thrown when rate limit is exceeded
 */
export class RateLimitError extends DiscordError {
  constructor(
    message: string = "Rate limit exceeded",
    public readonly retryAfter?: number
  ) {
    super(message, "RATE_LIMIT_EXCEEDED");
    this.name = "RateLimitError";
  }
}

/**
 * Error thrown when configuration is invalid
 */
export class ConfigurationError extends DiscordError {
  constructor(message: string, public readonly field?: string) {
    super(message, "INVALID_CONFIGURATION");
    this.name = "ConfigurationError";
  }
}

/**
 * Error thrown when an interaction cannot be replied to
 */
export class InteractionNotRepliableError extends DiscordInteractionError {
  constructor(interactionType?: string) {
    super(
      `Interaction of type "${interactionType || "unknown"}" is not repliable`,
      undefined,
      interactionType
    );
    this.name = "InteractionNotRepliableError";
  }
}
