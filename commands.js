const MongoClient = require("mongodb").MongoClient;
const mongoConnectionUri = process.env.MONGO_CONNECTION_URI;
const ytdl = require("ytdl-core");

const commands = {
  help: {
    invocation: "!help",
    argumentsAmount: 1,
    invoke: help,
  },
  addsound: {
    invocation: "addsound",
    argumentsAmount: 3,
    wrongFormat: "The format must be like `addsound <command> <link>`",
    invoke: addSound,
  },
  deletesound: {
    invocation: "delete",
    argumentsAmount: 2,
    wrongFormat: "The format must be like `addsound <command> <link>`",
    invoke: deleteSound,
  },
  play: {
    invocation: null,
    argumentsAmount: 1,
    invoke: playMusic,
  },
};

function help({ textCommand }) {}

async function playMusic({ message, voiceChannel }) {
  const command = message[0];

  if (voiceChannel) {
    const link = await getMusicLink(command, voiceChannel);

    const streamOptions = { seek: 0, volume: 1 };

    if (isUpperCase(command)) {
      streamOptions.volume = 10;
    }

    voiceChannel.join().then(connection => {
      const stream = ytdl(link, {
        filter: "audioonly",
      });
      const dispatcher = connection.playStream(stream, streamOptions);
      dispatcher.on("end", end => {
        voiceChannel.leave();
      });
    });
  }
}

function addSound({ message }) {}

function deleteSound({ message }) {}

async function getMusicLink(command) {
  const client = await MongoClient.connect(mongoConnectionUri, {
    useNewUrlParser: true,
  }).catch(err => {
    console.log(err);
  });

  if (!client) {
    return;
  }
  const collection = client.db("commands").collection("musics");
  const data = await collection.findOne({ command: command });

  client.close();

  return data.link;
}

function isUpperCase(str) {
  return str === str.toUpperCase();
}

module.exports = commands;
