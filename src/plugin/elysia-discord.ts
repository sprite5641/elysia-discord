import { Elysia } from "elysia";
import { verifyKey } from "discord-interactions";
import { DiscordHelper } from "../core/discord-helper";
import { DiscordLogger } from "../logger";
import type { DiscordOptions } from "../types";
import type { Interaction } from "discord.js";
import {
  ConfigurationError,
  SignatureVerificationError,
} from "../errors";

/**
 * Verify Discord signature using Ed25519
 */
async function verifyDiscordSignature(
  body: string,
  signature: string,
  timestamp: string,
  publicKey: string
): Promise<boolean> {
  try {
    return await verifyKey(body, signature, timestamp, publicKey);
  } catch (e) {
    return false;
  }
}

/**
 * Discord Interactions API webhook plugin for Elysia
 *
 * @example
 * Echo bot:
 * ```ts
 * import { Elysia } from 'elysia'
 * import { discord } from '@prachaya.dev5641/elysia-discord'
 *
 * new Elysia()
 * .use(discord({
 *   publicKey: process.env.DISCORD_PUBLIC_KEY!,
 *   botToken: process.env.DISCORD_BOT_TOKEN!,
 *   applicationId: process.env.DISCORD_APPLICATION_ID!,
 *   verbose: true
 * }))
 * .post('/interactions', async ({ discord }) => {
 *   discord.on('command', async (interaction) => {
 *     await discord.reply(interaction, {
 *       content: 'Hello from Discord!'
 *     })
 *   })
 *   await discord.handle()
 *   return discord.response
 * })
 * ```
 */
export const discord = (options: DiscordOptions) => {
  const { publicKey, botToken, applicationId, verbose = false } = options;

  if (!publicKey) {
    throw new ConfigurationError(
      "publicKey is required. Get it from Discord Developer Portal.",
      "publicKey"
    );
  }

  if (!botToken) {
    throw new ConfigurationError(
      "botToken is required. Get it from Discord Developer Portal.",
      "botToken"
    );
  }

  if (!applicationId) {
    throw new ConfigurationError(
      "applicationId is required. Get it from Discord Developer Portal.",
      "applicationId"
    );
  }

  const logger = new DiscordLogger(verbose);

  return new Elysia({
    name: "@prachaya.dev5641/elysia-discord",
    seed: options,
  })
    .state("discord-interaction", null as Interaction | null)
    .state("discord-response", null as any)
    .onRequest(async ({ request, set, store }) => {
      // We only care about POST requests
      if (request.method !== "POST") {
        return;
      }

      const requestId = Math.random().toString(36).substring(2, 9);
      logger.section(`Discord Interaction [${requestId}]`);

      const signature = request.headers.get("x-signature-ed25519");
      const timestamp = request.headers.get("x-signature-timestamp");

      if (!signature || !timestamp) {
        logger.warn(
          "Request ignored: Missing Discord signature headers"
        );
        set.status = 401;
        return { error: "Missing signature headers" };
      }

      logger.info("Signature verification started");

      let body: string;
      try {
        body = await request.text();
        logger.debug("Request body received", {
          contentLength: body.length,
          contentType: request.headers.get("content-type"),
        });
      } catch (e) {
        logger.error("Failed to read request body", e);
        set.status = 400;
        return { error: "Failed to read request body" };
      }

      // Verify signature
      const isValid = await verifyDiscordSignature(body, signature, timestamp, publicKey);

      if (!isValid) {
        logger.error("Signature verification failed", {
          signatureLength: signature.length,
          timestampLength: timestamp.length,
        });
        set.status = 401;
        return { error: "Invalid signature" };
      }

      logger.success("Signature verified");

      // Parse interaction payload
      try {
        const interaction: any = JSON.parse(body);

        logger.info("Discord interaction parsed", {
          type: interaction.type,
          id: interaction.id,
        });
        logger.debug("Full interaction payload", interaction);

        // Handle PING (type 1)
        if (interaction.type === 1) {
          logger.info("Responding to Discord PING");
          set.status = 200;
          return { type: 1 };
        }

        // Store interaction for later use in derive/handler
        store["discord-interaction"] = interaction;

        logger.success("Request processed successfully");
        logger.divider();
      } catch (e) {
        logger.error("Failed to parse JSON body", e);
        set.status = 400;
        return { error: "Invalid JSON body" };
      }
    })
    .derive({ as: "global" }, ({ store }) => {
      // Only provide discord helper if there's an interaction
      const interaction = store["discord-interaction"] as Interaction | null;

      if (!interaction) {
        return {
          discord: undefined,
        };
      }

      return {
        discord: new DiscordHelper(
          botToken,
          applicationId,
          interaction,
          logger
        ),
      };
    });
};
