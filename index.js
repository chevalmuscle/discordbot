const Discord = require("discord.js");
const client = new Discord.Client();
const MongoClient = require('mongodb').MongoClient;
const ytdl = require("ytdl-core");

require("dotenv").config(); // to use environment variables
const port = process.env.PORT;
const discordToken = process.env.DISCORD_TOKEN;
const mongoConnectionUri = process.env.MONGO_CONNECTION_URI;

const dbClient = new MongoClient(mongoConnectionUri, { useNewUrlParser: true });
dbClient.connect(err => {
  if (!err){
    console.log(err)
  }
  const collection = dbClient.db("test").collection("devices");
  console.log(collection)
  dbClient.close();
});

client.login(discordToken);

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

var http = require("http");
if (!http) process.exit(1);

var serveRequest = function(request, response) {
  const url = request.url;
  console.log(url);
  response.write("hello world !");
  response.end();
};

const server = http.createServer(serveRequest);

server.listen(port, err => {
  if (err) {
    return console.log("Something bad happened when starting to server", err);
  }
  console.log(`Listening on port ${port} 🐷`);
});
