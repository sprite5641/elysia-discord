# @prachaya.dev5641/elysia-discord

Official Discord Interactions API webhook plugin for Elysia — clean, typed, zero-config.

This plugin for ElysiaJS simplifies the process of creating Discord bots by providing a clean, typed, and zero-config integration with Discord's Interactions API.

## Features

- **Zero-config:** Just provide your application ID, public key, and bot token.
- **Type-safe:** Fully typed interaction handling for all Discord interactions.
- **Easy to use:** A simple and intuitive API for handling interactions and sending messages.
- **Official SDK:** Built on top of the official `discord.js`.

## Installation

```bash
bun add @prachaya.dev5641/elysia-discord
```

## Usage

```ts
import { Elysia } from "elysia";
import { discord } from "@prachaya.dev5641/elysia-discord";

const app = new Elysia()
  .use(
    discord({
      publicKey: process.env.DISCORD_PUBLIC_KEY!,
      botToken: process.env.DISCORD_BOT_TOKEN!,
      applicationId: process.env.DISCORD_APPLICATION_ID!,
    })
  )
  .post("/interactions", async ({ discord, set }) => {
    if (!discord) {
      return "Not a Discord interaction";
    }

    discord.on("command", async (interaction) => {
      if (interaction.commandName === "ping") {
        await discord.reply(interaction, {
          content: "Pong!",
        });
      }
    });

    await discord.handle();
    return discord.response;
  })

  .listen(3000);

console.log(`Elysia is running at http://localhost:3000`);
```

## API

### `discord(options: DiscordOptions)`

The main plugin function.

- `options.publicKey`: Your Discord application public key (for signature verification).
- `options.botToken`: Your Discord bot token (for sending messages).
- `options.applicationId`: Your Discord application ID.
- `options.verbose` (optional): Set to `true` to enable detailed, colorful logging for debugging. Defaults to `false`.

### `discord.on(eventType, handler)`

Registers an interaction handler for a specific interaction type. The `interaction` object in the handler is fully typed based on the `eventType`.

Supported interaction types:

- `command` - Slash command interactions
- `button` - Button component interactions
- `select` - Select menu interactions
- `modal` - Modal submit interactions
- `autocomplete` - Autocomplete interactions
- `*` (wildcard for all interactions)

### `discord.reply(interaction, message)`

Replies to an interaction.

```ts
await discord.reply(interaction, {
  content: 'Hello!',
  ephemeral: true
})
```

### `discord.deferReply(interaction, options)`

Defers the reply for long-running operations (you have 15 minutes to edit the reply).

```ts
await discord.deferReply(interaction, { ephemeral: true })
// ... do some work
await discord.editReply(interaction, { content: 'Done!' })
```

### `discord.editReply(interaction, message)`

Edits a deferred or previous reply.

```ts
await discord.editReply(interaction, {
  content: 'Updated message!'
})
```

### `discord.followUp(interaction, message)`

Sends a follow-up message to an interaction.

```ts
await discord.followUp(interaction, {
  content: 'Follow-up message!',
  ephemeral: true
})
```

### `discord.getInteraction()`

Returns the raw Discord interaction.

### `discord.getClient()`

Returns the underlying Discord REST client for advanced usage.

## Error Handling

The library provides typed error classes for better error management:

```ts
import {
  discord,
  DiscordInteractionError,
  SignatureVerificationError,
  ConfigurationError,
  InteractionNotRepliableError
} from '@prachaya.dev5641/elysia-discord'

try {
  await discord.reply(interaction, { content: 'Hello!' })
} catch (error) {
  if (error instanceof InteractionNotRepliableError) {
    console.error('Cannot reply to this interaction')
  } else if (error instanceof DiscordInteractionError) {
    console.error('Discord API error:', error.message)
  }
}
```

Available error classes:
- `DiscordError` - Base error class
- `SignatureVerificationError` - Signature verification failed
- `DiscordInteractionError` - Interaction processing error
- `RateLimitError` - Rate limit exceeded
- `ConfigurationError` - Invalid configuration
- `InteractionNotRepliableError` - Interaction cannot be replied to

## Exports

This package exports the following main components:

- `discord`: The main Elysia plugin.
- `DiscordHelper`: The helper class for handling interactions and sending messages. You can access it via `context.discord`.
- `DiscordLogger`: The internal logger class.
- All relevant types from `discord.js`, such as `Interaction`, `CommandInteraction`, `ButtonInteraction`, etc.

## Project Structure

The project is organized into the following directories:

- `src/`: The main source code directory.
  - `core/`: Contains the core logic, like the `DiscordHelper` class.
  - `logger/`: Contains the `DiscordLogger` class for logging.
  - `plugin/`: Contains the main Elysia plugin logic.
  - `types/`: Contains all type definitions for the plugin.
  - `index.ts`: The main entry point, which exports all public APIs.
- `dist/`: The compiled JavaScript output.
- `test/`: Example and test applications.

## Development

This project uses [Bun](https://bun.sh/) for package management and running scripts.

To install dependencies:

```bash
bun install
```

To build the project (compiles TypeScript from `src/` to JavaScript in `dist/`):

```bash
bun run build
```

To run the example application located in `test/app.ts`:

```bash
bun run test/app.ts
```
