require('dotenv').config();
const {
  Client,
  Collection,
  Events,
  GatewayIntentBits,
  REST,
  Routes
} = require('discord.js');

const { Player } = require('discord-player');
const fs = require('fs');
const path = require('path');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
  ]
});

const commands = [];
client.commands = new Collection();

const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);

    if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
      commands.push(command.data.toJSON());
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
}

client.once(Events.ClientReady, async readyClient => {
  console.log(`Ready! Logged in as ${readyClient.user.tag}`);

  const guildIds = readyClient.guilds.cache.map(guild => guild.id);
  const rest = new REST({version: '10'}).setToken(process.env.TOKEN);

  const player = new Player(client);
  await player.extractors.loadDefault((ext) => ext !== 'YouTubeExtractor');
  player.events.on('playerStart', (queue, track) => {
    queue.metadata.channel.send(`Started playing **${track.title}**!`);
  });

  for (const guildId of guildIds) {
      rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, guildId), 
          {body: commands})
      .then(() => console.log('Successfully updated commands for guild ' + guildId))
      .catch(console.error);
  }
});

client.on(Events.InteractionCreate, async interaction => {
    if(!interaction.isCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
      console.error(`No command matching ${interaction.commandName} was found.`);
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
      } else {
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
      }
    }
});

client.login(process.env.TOKEN);