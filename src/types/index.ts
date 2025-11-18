import type {
  Interaction,
  CommandInteraction,
  ButtonInteraction,
  StringSelectMenuInteraction,
  ModalSubmitInteraction,
  AutocompleteInteraction,
} from "discord.js";
import type { DiscordHelper } from "../core/discord-helper.ts";

/**
 * Discord webhook plugin configuration
 */
export interface DiscordOptions {
  /**
   * Discord application public key for signature verification (required)
   */
  publicKey: string;

  /**
   * Discord bot token (required for sending messages)
   */
  botToken: string;

  /**
   * Discord application ID (required)
   */
  applicationId: string;

  /**
   * Enable verbose logging for debugging.
   * When true, detailed logs will be outputted with professional formatting.
   * Defaults to false.
   */
  verbose?: boolean;
}

export type InteractionEventMap = {
  command: CommandInteraction;
  button: ButtonInteraction;
  select: StringSelectMenuInteraction;
  modal: ModalSubmitInteraction;
  autocomplete: AutocompleteInteraction;
  "*": Interaction;
};

/**
 * Interaction handler type
 */
export type InteractionHandler<T = any> = (
  interaction: T
) => void | Promise<void>;

export type InteractionHandlers = Map<
  keyof InteractionEventMap,
  InteractionHandler[]
>;

/**
 * Discord Store interface
 */
export interface DiscordStore {
  "discord-interaction": Interaction | null;
  "discord-response": any;
}

/**
 * Discord context added to Elysia
 */
export interface DiscordContext {
  discord: DiscordHelper | undefined;
}
