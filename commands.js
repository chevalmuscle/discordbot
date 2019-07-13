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

function help({ textChannel }) {
  getMusicCommands().then(
    response => {
      textChannel.send("By Chevalmusclé");
      textChannel.send(
        response.map(musicCommand => musicCommand.command).join(", "),
      );
    },
    reject => {
      console.log(reject);
    },
  );
}

async function playMusic({ message, voiceChannel }) {
  const command = message[0];

  if (voiceChannel) {
    getMusicCommand(command).then(
      response => {
        const streamOptions = { seek: 0, volume: 1 };

        if (isUpperCase(command)) {
          streamOptions.volume = 10;
        }

        voiceChannel.join().then(connection => {
          const stream = ytdl(response.link, {
            filter: "audioonly",
          });
          const dispatcher = connection.playStream(stream, streamOptions);
          dispatcher.on("end", end => {
            voiceChannel.leave();
          });
        });
      },
      reject => {
        console.log(reject);
      },
    );
  }
}

function addSound({ message, textChannel }) {
  const soundCommand = message[1];
  const link = message[2];

  getMusicCommand(soundCommand).then(
    response => {
      textChannel.send(`This command already exists with ${response.link}`);
    },
    reject => {
      addSoundToCollection(soundCommand, link, "musics");
    },
  );
}

function deleteSound({ message, textChannel }) {
  const soundCommand = message[1];

  getMusicCommand(soundCommand).then(response => {
    addSoundToCollection(response.command, response.link, "old_musics").then(
      response => {
        deleteSoundFromDB(soundCommand);
      },
      reject => {
        console.log(reject);
      },
    );
  });
}

function getMusicCommands() {
  return new Promise(async (resolve, reject) => {
    const client = await MongoClient.connect(mongoConnectionUri, {
      useNewUrlParser: true,
    }).catch(err => {
      reject(err);
    });

    const collection = client.db("commands").collection("musics");
    const musicCommands = await collection.find().toArray();
    client.close();
    resolve(musicCommands);
  });
}

function getMusicCommand(command) {
  return new Promise(async (resolve, reject) => {
    const client = await MongoClient.connect(mongoConnectionUri, {
      useNewUrlParser: true,
    }).catch(err => {
      console.log(err);
    });

    const collection = client.db("commands").collection("musics");
    const data = await collection.findOne({ command: command.toLowerCase() });

    if (data !== null) {
      resolve(data);
    } else {
      reject("Command not found");
    }
    client.close();
  });
}

function addSoundToCollection(soundCommand, link, collectionName) {
  return new Promise(async (resolve, reject) => {
    const client = await MongoClient.connect(mongoConnectionUri, {
      useNewUrlParser: true,
    }).catch(err => {
      console.log(err);
    });

    const collection = client.db("commands").collection(collectionName);
    await collection.insertOne(
      {
        command: soundCommand.toLowerCase(),
        link: link,
        timestamp: new Date(),
      },
      function(err, res) {
        if (err) {
          reject(err);
        }
        console.log("1 document inserted");
      },
    );

    client.close();
    resolve(`${soundCommand} inserted in ${collectionName}`);
  });
}

function deleteSoundFromDB(soundCommand) {
  return new Promise(async (resolve, reject) => {
    const client = await MongoClient.connect(mongoConnectionUri, {
      useNewUrlParser: true,
    }).catch(err => {
      console.log(err);
    });

    const collection = client.db("commands").collection("musics");
    await collection.deleteOne(
      {
        command: soundCommand.toLowerCase(),
      },
      function(err, obj) {
        if (err) {
          reject(err);
        }
        console.log("1 document deleted");
      },
    );
    client.close();
    resolve("command deleted");
  });
}

function isUpperCase(str) {
  return str === str.toUpperCase();
}

module.exports = commands;
