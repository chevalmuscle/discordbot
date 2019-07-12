const Discord = require("discord.js");
const client = new Discord.Client();
const ytdl = require("ytdl-core");

client.login(process.env.DISCORD_TOKEN);

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on("message", async message => {
  // Voice only works in guilds, if the message does not come from a guild,
  // we ignore it
  if (!message.guild) return;

  if (message.content === "/join") {
    // Only try to join the sender's voice channel if they are in one themselves
    if (message.member.voiceChannel) {
      const streamOptions = { seek: 0, volume: 1 };
      message.member.voiceChannel.join().then(connection => {
        // ReadableStreams, in this example YouTube audio
        const stream = ytdl("https://www.youtube.com/watch?v=ZyhrYis509A", {
          filter: "audioonly",
        });
        const dispatcher = connection.playStream(stream, streamOptions);
      });
    } else {
      message.reply("You need to join a voice channel first!");
    }
  }
});
