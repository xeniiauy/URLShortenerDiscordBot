const { Client, GatewayIntentBits, SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, Events } = require('discord.js');
const axios = require('axios');
require('dotenv').config();

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent] });

// Bitly API token and URL
const BITLY_ACCESS_TOKEN = process.env.BITLY_ACCESS_TOKEN;
const BITLY_API_URL = 'https://api-ssl.bitly.com/v4/shorten';

// Register slash command to trigger the shortening process
const commands = [
  new SlashCommandBuilder()
    .setName('shorten')
    .setDescription('Shorten a long URL')
].map(cmd => cmd.toJSON());

// When bot is ready
client.once('ready', () => {
  console.log(`Altafulla Bot is online as ${client.user.tag}`);
  // Register slash commands with Discord API
  client.application.commands.set(commands);
});

// Shorten URL using Bitly API
const shortenUrl = async (longUrl) => {
  try {
    const response = await axios.post(BITLY_API_URL, {
      long_url: longUrl
    }, {
      headers: {
        Authorization: `Bearer ${BITLY_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data.link;  // Return the shortened URL
  } catch (error) {
    console.error('Error shortening URL:', error);
    return 'Sorry, I couldn\'t shorten the URL. Please try again later.';
  }
};

// Handle interactions (slash commands and modals)
client.on(Events.InteractionCreate, async interaction => {
  if (interaction.isCommand()) {
    if (interaction.commandName === 'shorten') {
      // Create a modal to ask the user for the URL
      const modal = new ModalBuilder()
        .setCustomId('shorten_modal')
        .setTitle('Shorten your URL')

      // Add a text input for the URL field
      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('long_url')
            .setLabel("Enter the long URL you want to shorten:")
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
        )
      );

      await interaction.showModal(modal);
    }
  }

  // Handle the modal submission
  if (interaction.isModalSubmit() && interaction.customId === 'shorten_modal') {
    const longUrl = interaction.fields.getTextInputValue('long_url');

    // Check if the URL is valid
    const urlRegex = /^(https?:\/\/[^\s]+)$/;
    if (!urlRegex.test(longUrl)) {
      return await interaction.reply({ content: '❌ Invalid URL. Please provide a valid URL.', ephemeral: true });
    }

    // Shorten the URL
    const shortenedUrl = await shortenUrl(longUrl);
    await interaction.reply(`🔗 Here is your shortened URL: ${shortenedUrl}`);
  }
});

// Log into Discord
client.login(process.env.DISCORD_TOKEN);
