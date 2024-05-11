const { SlashCommandBuilder } = require('discord.js');
const { useMainPlayer } = require('discord-player');

const data = new SlashCommandBuilder()
  .setName('play')
  .setDescription('Plays a song.')
  .addStringOption(option =>
    option
    .setName('url')
    .setDescription('Song Url.')
    .setRequired(true)
  )

module.exports = {
	data: data,
	async execute(interaction) {
    const channel = interaction.member.voice.channel;
		if (!channel)
      return interaction.reply("Get your sorry ass in to a Voice Channel.");

    const player = useMainPlayer();
    const query = interaction.options.getString('url', true);

    try {
      const { track } = await player.play(channel, query, {
          nodeOptions: {
            metadata: interaction
          }
      });

      return interaction.followUp(`**${track.title}** enqueued!`);
    } catch (e) {
      return interaction.followUp(`Something went wrong: ${e}`);
    }
	},
};