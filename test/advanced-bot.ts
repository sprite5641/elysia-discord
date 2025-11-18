import { Elysia } from "elysia";
import {
  discord,
  DiscordInteractionError,
  InteractionNotRepliableError,
} from "../src/index";

/**
 * Advanced Discord Bot Example
 * 
 * This example showcases:
 * - Multiple command types
 * - Deferred replies for long operations
 * - Button interactions
 * - Error handling
 * - Follow-up messages
 */

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

    // Handle all interactions (wildcard)
    discord.on("*", (interaction) => {
      console.log(`📨 Received interaction: ${interaction.type}`);
    });

    // Handle slash commands
    discord.on("command", async (interaction) => {
      try {
        switch (interaction.commandName) {
          case "ping":
            await discord.reply(interaction, {
              content: "🏓 Pong!",
            });
            break;

          case "hello":
            await discord.reply(interaction, {
              content: `👋 Hello, ${interaction.user.username}!`,
              ephemeral: true,
            });
            break;

          case "info":
            await discord.reply(interaction, {
              embeds: [
                {
                  title: "Bot Information",
                  description: "A Discord bot built with Elysia and @prachaya.dev5641/elysia-discord",
                  color: 0x5865f2,
                  fields: [
                    { name: "Version", value: "1.1.6", inline: true },
                    { name: "Framework", value: "Elysia", inline: true },
                  ],
                  timestamp: new Date().toISOString(),
                },
              ],
            });
            break;

          case "slow":
            // Defer reply for long-running operations
            await discord.deferReply(interaction);

            // Simulate slow API call or computation
            await new Promise((resolve) => setTimeout(resolve, 3000));

            await discord.editReply(interaction, {
              content: "✅ Completed after 3 seconds!",
            });

            // Send a follow-up message
            await discord.followUp(interaction, {
              content: "This is a follow-up message!",
              ephemeral: true,
            });
            break;

          case "error":
            // Demonstrate error handling
            throw new Error("This is a test error!");

          default:
            await discord.reply(interaction, {
              content: `❓ Unknown command: ${interaction.commandName}`,
              ephemeral: true,
            });
        }
      } catch (error) {
        console.error("❌ Error handling command:", error);

        // Handle different error types
        if (error instanceof InteractionNotRepliableError) {
          console.error("Interaction cannot be replied to");
        } else if (error instanceof DiscordInteractionError) {
          console.error(`Discord API error: ${error.message}`);
        } else {
          // Try to send an error message to the user
          try {
            if (interaction.isRepliable() && !interaction.replied) {
              await discord.reply(interaction, {
                content: "❌ An error occurred while processing your command.",
                ephemeral: true,
              });
            }
          } catch (replyError) {
            console.error("Failed to send error message:", replyError);
          }
        }
      }
    });

    // Handle button clicks
    discord.on("button", async (interaction) => {
      try {
        await discord.reply(interaction, {
          content: `✅ Button clicked: \`${interaction.customId}\``,
          ephemeral: true,
        });
      } catch (error) {
        console.error("Error handling button:", error);
      }
    });

    // Handle select menus
    discord.on("select", async (interaction) => {
      try {
        const values = (interaction as any).values || [];
        await discord.reply(interaction, {
          content: `You selected: ${values.join(", ")}`,
          ephemeral: true,
        });
      } catch (error) {
        console.error("Error handling select menu:", error);
      }
    });

    // Handle modal submissions
    discord.on("modal", async (interaction) => {
      try {
        await discord.reply(interaction, {
          content: "Modal submitted successfully!",
          ephemeral: true,
        });
      } catch (error) {
        console.error("Error handling modal:", error);
      }
    });

    // Handle autocomplete
    discord.on("autocomplete", async (interaction) => {
      try {
        // Autocomplete responses are handled differently
        // This is just for logging
        console.log("Autocomplete interaction received");
      } catch (error) {
        console.error("Error handling autocomplete:", error);
      }
    });

    await discord.handle();
    return discord.response || "OK";
  })
  .get("/", () => ({
    message: "Discord Bot is running!",
    endpoints: {
      interactions: "/interactions",
    },
  }))
  .get("/health", () => ({
    status: "healthy",
    timestamp: new Date().toISOString(),
  }))
  .listen(3000);

console.log(`
╔════════════════════════════════════════╗
║  🤖 Discord Bot Started!              ║
╟────────────────────────────────────────╢
║  📍 Interactions: /interactions        ║
║  🏠 Home: http://localhost:3000        ║
║  ❤️  Health: http://localhost:3000/health ║
╚════════════════════════════════════════╝
`);
