import { Elysia } from "elysia";
import { discord } from "../src/index";

const app = new Elysia()
  .use(
    discord({
      publicKey: process.env.DISCORD_PUBLIC_KEY!,
      botToken: process.env.DISCORD_BOT_TOKEN!,
      applicationId: process.env.DISCORD_APPLICATION_ID!,
      verbose: true,
    })
  )
  .post("/interactions", async ({ discord, set }) => {
    if (!discord) {
      return "Not a Discord interaction";
    }

    // Register handlers before handle
    discord.on("command", async (interaction) => {
      try {
        if (interaction.commandName === "ping") {
          await discord.reply(interaction, {
            content: "Pong!",
          });
        } else if (interaction.commandName === "hello") {
          await discord.reply(interaction, {
            content: `Hello, ${interaction.user.username}!`,
          });
        } else if (interaction.commandName === "slow") {
          // Example of deferred reply for long-running operations
          await discord.deferReply(interaction, { ephemeral: true });
          
          // Simulate slow operation
          await new Promise((resolve) => setTimeout(resolve, 3000));
          
          await discord.editReply(interaction, {
            content: "This took 3 seconds to process!",
          });
        }
      } catch (error) {
        console.error("Error handling command:", error);
      }
    });

    discord.on("button", async (interaction) => {
      await discord.reply(interaction, {
        content: `Button clicked: ${interaction.customId}`,
        ephemeral: true,
      });
    });

    await discord.handle();
    return discord.response || "OK";
  })
  .listen(3000);

console.log(`🚀 Elysia Discord Bot running at http://localhost:3000`);
