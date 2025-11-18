import {
  Client,
  REST,
  Routes,
  type Interaction,
  type InteractionResponse,
  InteractionType,
} from "discord.js";
import type {
  InteractionEventMap,
  InteractionHandler,
  InteractionHandlers,
} from "../types";
import type { DiscordLogger } from "../logger";
import {
  DiscordInteractionError,
  InteractionNotRepliableError,
} from "../errors";

/**
 * Discord Helper - Provides easy-to-use methods for handling Discord interactions
 */
export class DiscordHelper {
  private rest: REST;
  private interaction: Interaction | null;
  private handlers: InteractionHandlers = new Map();
  private logger: DiscordLogger;
  private applicationId: string;
  public response: any = null;

  constructor(
    botToken: string,
    applicationId: string,
    interaction: Interaction | null,
    logger: DiscordLogger
  ) {
    this.rest = new REST({ version: "10" }).setToken(botToken);
    this.interaction = interaction;
    this.logger = logger;
    this.applicationId = applicationId;
  }

  /**
   * Register interaction handler
   *
   * @example
   * ```ts
   * discord.on('command', async (interaction) => {
   *   console.log(interaction.commandName)
   * })
   *
   * discord.on('*', (interaction) => {
   *   console.log('Received any interaction:', interaction.type)
   * })
   * ```
   */
  on<K extends keyof InteractionEventMap>(
    interactionType: K,
    handler: InteractionHandler
  ): this {
    if (!this.handlers.has(interactionType)) {
      this.handlers.set(interactionType, []);
    }
    this.handlers.get(interactionType)!.push(handler);

    this.logger.debug(`Handler registered`, {
      interactionType: String(interactionType),
    });
    return this;
  }

  /**
   * Execute registered handlers
   */
  async handle(): Promise<void> {
    if (!this.interaction) {
      this.logger.warn("No interaction to handle");
      return;
    }

    const startTime = Date.now();
    this.logger.section("Interaction Handler Execution");
    this.logger.info(`Processing interaction type: ${this.interaction.type}`);

    const promises: (void | Promise<void>)[] = [];
    const wildcardHandlers = this.handlers.get("*") || [];
    let totalHandlers = 0;

    // Handle wildcard handlers
    if (wildcardHandlers.length > 0) {
      totalHandlers += wildcardHandlers.length;
      for (const handler of wildcardHandlers) {
        promises.push(handler(this.interaction));
      }
    }

    // Handle specific interaction types
    let handlerKey: keyof InteractionEventMap | null = null;

    if (this.interaction.isChatInputCommand()) {
      handlerKey = "command";
    } else if (this.interaction.isButton()) {
      handlerKey = "button";
    } else if (
      this.interaction.isStringSelectMenu() ||
      this.interaction.isUserSelectMenu() ||
      this.interaction.isRoleSelectMenu() ||
      this.interaction.isChannelSelectMenu()
    ) {
      handlerKey = "select";
    } else if (this.interaction.isModalSubmit()) {
      handlerKey = "modal";
    } else if (this.interaction.isAutocomplete()) {
      handlerKey = "autocomplete";
    }

    if (handlerKey) {
      const handlers = this.handlers.get(handlerKey) || [];
      if (handlers.length > 0) {
        totalHandlers += handlers.length;
        this.logger.debug(
          `Executing ${handlers.length} handler(s) for ${handlerKey}`
        );
        for (const handler of handlers) {
          promises.push(handler(this.interaction as any));
        }
      }
    }

    try {
      await Promise.all(promises);
      const duration = Date.now() - startTime;
      this.logger.success(`All handlers completed successfully`, {
        totalHandlers,
        duration: `${duration}ms`,
      });
    } catch (e) {
      const duration = Date.now() - startTime;
      this.logger.error(`Handler execution failed after ${duration}ms`, e);
      throw e;
    }
  }

  /**
   * Reply to an interaction
   *
   * @example
   * ```ts
   * await discord.reply(interaction, {
   *   content: 'Hello!',
   *   ephemeral: true
   * })
   * ```
   */
  async reply(
    interaction: Interaction,
    message: { content?: string; embeds?: any[]; ephemeral?: boolean }
  ): Promise<void> {
    if (!interaction.isRepliable()) {
      const error = new InteractionNotRepliableError(
        InteractionType[interaction.type]
      );
      this.logger.error(error.message);
      throw error;
    }

    this.logger.info(`Sending reply`, {
      ephemeral: message.ephemeral || false,
      hasEmbeds: (message.embeds?.length || 0) > 0,
    });
    this.logger.debug("Reply message content", message);

    try {
      const startTime = Date.now();
      const response = await interaction.reply({
        content: message.content,
        embeds: message.embeds,
        ephemeral: message.ephemeral,
      });
      this.response = { type: 4, data: message };
      const duration = Date.now() - startTime;
      this.logger.success(`Reply sent successfully (${duration}ms)`);
    } catch (e) {
      const error = new DiscordInteractionError(
        `Failed to send reply: ${e instanceof Error ? e.message : String(e)}`,
        interaction.id,
        InteractionType[interaction.type]
      );
      this.logger.error(error.message, e);
      throw error;
    }
  }

  /**
   * Defer reply to an interaction (for long-running operations)
   *
   * @example
   * ```ts
   * await discord.deferReply(interaction, { ephemeral: true })
   * // ... do some work
   * await discord.editReply(interaction, { content: 'Done!' })
   * ```
   */
  async deferReply(
    interaction: Interaction,
    options?: { ephemeral?: boolean }
  ): Promise<void> {
    if (!interaction.isRepliable()) {
      const error = new InteractionNotRepliableError(
        InteractionType[interaction.type]
      );
      this.logger.error(error.message);
      throw error;
    }

    this.logger.info(`Deferring reply`, {
      ephemeral: options?.ephemeral || false,
    });

    try {
      const startTime = Date.now();
      await interaction.deferReply({
        ephemeral: options?.ephemeral,
      });
      this.response = { type: 5, data: options };
      const duration = Date.now() - startTime;
      this.logger.success(`Reply deferred successfully (${duration}ms)`);
    } catch (e) {
      const error = new DiscordInteractionError(
        `Failed to defer reply: ${e instanceof Error ? e.message : String(e)}`,
        interaction.id,
        InteractionType[interaction.type]
      );
      this.logger.error(error.message, e);
      throw error;
    }
  }

  /**
   * Edit a deferred or previous reply
   *
   * @example
   * ```ts
   * await discord.editReply(interaction, {
   *   content: 'Updated message!'
   * })
   * ```
   */
  async editReply(
    interaction: Interaction,
    message: { content?: string; embeds?: any[] }
  ): Promise<void> {
    if (!interaction.isRepliable()) {
      const error = new InteractionNotRepliableError(
        InteractionType[interaction.type]
      );
      this.logger.error(error.message);
      throw error;
    }

    this.logger.info(`Editing reply`, {
      hasEmbeds: (message.embeds?.length || 0) > 0,
    });
    this.logger.debug("Edit message content", message);

    try {
      const startTime = Date.now();
      await interaction.editReply({
        content: message.content,
        embeds: message.embeds,
      });
      const duration = Date.now() - startTime;
      this.logger.success(`Reply edited successfully (${duration}ms)`);
    } catch (e) {
      const error = new DiscordInteractionError(
        `Failed to edit reply: ${e instanceof Error ? e.message : String(e)}`,
        interaction.id,
        InteractionType[interaction.type]
      );
      this.logger.error(error.message, e);
      throw error;
    }
  }

  /**
   * Send a follow-up message to an interaction
   *
   * @example
   * ```ts
   * await discord.followUp(interaction, {
   *   content: 'Follow-up message!'
   * })
   * ```
   */
  async followUp(
    interaction: Interaction,
    message: { content?: string; embeds?: any[]; ephemeral?: boolean }
  ): Promise<void> {
    if (!interaction.isRepliable()) {
      const error = new InteractionNotRepliableError(
        InteractionType[interaction.type]
      );
      this.logger.error(error.message);
      throw error;
    }

    this.logger.info(`Sending follow-up`, {
      ephemeral: message.ephemeral || false,
      hasEmbeds: (message.embeds?.length || 0) > 0,
    });
    this.logger.debug("Follow-up message content", message);

    try {
      const startTime = Date.now();
      await interaction.followUp({
        content: message.content,
        embeds: message.embeds,
        ephemeral: message.ephemeral,
      });
      const duration = Date.now() - startTime;
      this.logger.success(`Follow-up sent successfully (${duration}ms)`);
    } catch (e) {
      const error = new DiscordInteractionError(
        `Failed to send follow-up: ${e instanceof Error ? e.message : String(e)}`,
        interaction.id,
        InteractionType[interaction.type]
      );
      this.logger.error(error.message, e);
      throw error;
    }
  }

  /**
   * Get raw interaction
   */
  getInteraction(): Interaction | null {
    return this.interaction;
  }

  /**
   * Get REST client for advanced usage
   */
  getClient(): REST {
    return this.rest;
  }
}
