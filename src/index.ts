// Credit: sprite5641
// src/index.ts
/**
 * @prachaya.dev5641/elysia-discord
 *
 * Discord Interactions API webhook plugin for Elysia with official SDK integration
 *
 * @example
 * ```ts
 * import { Elysia } from 'elysia'
 * import { discord } from '@prachaya.dev5641/elysia-discord'
 *
 * new Elysia()
 * .use(
 * discord({
 * publicKey: process.env.DISCORD_PUBLIC_KEY!,
 * botToken: process.env.DISCORD_BOT_TOKEN!,
 * applicationId: process.env.DISCORD_APPLICATION_ID!,
 * verbose: true
 * })
 * )
 * .post('/interactions', ({ discord }) =>
 * discord.on('command', async (interaction) =>
 * discord.reply(interaction, {
 * content: 'Hello from Discord!'
 * })
 * )
 * )
 * .listen(3000)
 * ```
 *
 * @module
 */

import { discord } from "./plugin/elysia-discord.ts";

export { discord };
export default discord;

/**
 * Re-export commonly used types
 */
export type {
  Interaction,
  CommandInteraction,
  ButtonInteraction,
  StringSelectMenuInteraction,
  ModalSubmitInteraction,
  AutocompleteInteraction,
} from "discord.js";

export type {
  DiscordOptions,
  DiscordContext,
  DiscordStore,
  InteractionEventMap,
  InteractionHandler,
} from "./types";

export { DiscordHelper } from "./core/discord-helper";
export { DiscordLogger } from "./logger";

/**
 * Re-export error classes
 */
export {
  DiscordError,
  DiscordInteractionError,
  SignatureVerificationError,
  RateLimitError,
  ConfigurationError,
  InteractionNotRepliableError,
} from "./errors";