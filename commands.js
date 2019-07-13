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

async function help({ textChannel }) {
  const musicCommands = await getMusicCommands();
  textChannel.send("By Chevalmusclé");
  textChannel.send(
    musicCommands.map(musicCommand => musicCommand.command).join(", "),
  );
}

async function playMusic({ message, voiceChannel }) {
  const command = message[0];

  if (voiceChannel) {
    const data = await getMusicCommand(command.toLowerCase(), voiceChannel);

    const streamOptions = { seek: 0, volume: 1 };

    if (isUpperCase(command)) {
      streamOptions.volume = 10;
    }

    voiceChannel.join().then(connection => {
      const stream = ytdl(data.link, {
        filter: "audioonly",
      });
      const dispatcher = connection.playStream(stream, streamOptions);
      dispatcher.on("end", end => {
        voiceChannel.leave();
      });
    });
  }
}

function addSound({ message, textChannel }) {
  const soundCommand = message[1];
  const link = message[2];

  getMusicCommand(soundCommand, link).then(
    response => {
      textChannel.send(`This command already exists with ${response.link}`);
    },
    err => {
      addSoundToDB(soundCommand, link);
    },
  );
}

function deleteSound({ message }) {}

async function getMusicCommands() {
  const client = await MongoClient.connect(mongoConnectionUri, {
    useNewUrlParser: true,
  }).catch(err => {
    console.log(err);
  });

  if (!client) {
    return;
  }
  const collection = client.db("commands").collection("musics");
  const musicCommands = await collection.find().toArray();
  client.close();
  return musicCommands;
}

async function getMusicCommand(command) {
  return new Promise(async (resolve, reject) => {
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

    if (data !== null) {
      resolve(data);
    } else {
      reject("Command not found");
    }
    client.close();
  });
}

async function addSoundToDB(soundCommand, link) {
  const client = await MongoClient.connect(mongoConnectionUri, {
    useNewUrlParser: true,
  }).catch(err => {
    console.log(err);
  });

  if (!client) {
    return;
  }
  const collection = client.db("commands").collection("musics");
  await collection.insertOne(
    {
      command: soundCommand.toLowerCase(),
      link: link,
    },
    function(err, res) {
      if (err) throw err;
      console.log("1 document inserted");
    },
  );

  client.close();
}

function isUpperCase(str) {
  return str === str.toUpperCase();
}

module.exports = commands;
