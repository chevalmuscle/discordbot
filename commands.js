const MongoClient = require("mongodb").MongoClient;
const mongoConnectionUri = process.env.MONGO_CONNECTION_URI;
const ytdl = require("ytdl-core");

const commands = {
  help: {
    invocation: "!help",
    argumentsAmount: 1,
    help: "!help to help",
    invoke: help,
  },
  addsound: {
    invocation: "addsound",
    argumentsAmount: 3,
    help: "The format must be like `addsound <command> <link>`",
    invoke: addSound,
  },
  deletesound: {
    invocation: "deletesound",
    argumentsAmount: 2,
    help: "The format must be like `deletesound <command>`",
    invoke: deleteSound,
  },
  playYoutube: {
    invocation: "play",
    argumentsAmount: 2,
    invoke: playYoutube,
  },
  play: {
    invocation: null,
    argumentsAmount: 1,
    invoke: playMusic,
  },
};

function help({ textChannel }) {
  textChannel.send("By Chevalmusclé");

  const commandsDescription = [];
  for (let key in commands) {
    if (commands[key].invocation !== null) {
      commandsDescription.push({
        name: commands[key].invocation,
        value: commands[key].help,
      });
    }
  }
  const embedCommandDescriptions = {
    color: 0xff0000,
    title: "General Commands",
    fields: commandsDescription,
  };

  textChannel.send({ embed: embedCommandDescriptions });

  getMusicCommands()
    .then(
      response => {
        textChannel.send(
          `Sounds: \n ${response
            .map(musicCommand => musicCommand.command)
            .join(", ")}`,
        );
      },
      reject => {
        console.log(reject);
      },
    )
    .catch(e => console.log(e));
}

async function playYoutube({ message, voiceChannel }){
  const youtubeLink = message[1];

  const streamOptions = { volume: 1, passes: 3 };

  voiceChannel
    .join()
    .then(connection => {
      const stream = ytdl(youtubeLink, {
        filter: "audioonly",
      });
      const dispatcher = connection.playStream(stream, streamOptions);
      dispatcher.on("end", end => {
        voiceChannel.leave();
      });
    })
    .catch(e => console.log(e));
}

async function playMusic({ message, voiceChannel }) {
  const command = message[0];

  if (voiceChannel) {
    getMusicCommand(command)
      .then(
        response => {
          const streamOptions = { volume: 1, passes: 3 };

          if (isUpperCase(command)) {
            streamOptions.volume = 10;
          }

          voiceChannel
            .join()
            .then(connection => {
              const stream = ytdl(response.link, {
                filter: "audioonly",
              });
              const dispatcher = connection.playStream(stream, streamOptions);
              dispatcher.on("end", end => {
                voiceChannel.leave();
              });
            })
            .catch(e => console.log(e));
        },
        reject => {
          console.log(reject);
        },
      )
      .catch(e => console.log(e));
  }
}

function addSound({ message, textChannel }) {
  const soundCommand = message[1];
  const link = message[2];

  getMusicCommand(soundCommand)
    .then(
      response => {
        textChannel.send(`This command already exists with ${response.link}`);
      },
      reject => {
        addSoundToCollection(soundCommand, link, "musics");
      },
    )
    .catch(e => console.log(e));
}

function deleteSound({ message, textChannel }) {
  const soundCommand = message[1];

  getMusicCommand(soundCommand)
    .then(response => {
      addSoundToCollection(response.command, response.link, "old_musics").then(
        response => {
          deleteSoundFromDB(soundCommand);
        },
        reject => {
          console.log(reject);
        },
      );
    })
    .catch(e => console.log(e));
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
        console.log("1 document inserted", res);
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
        console.log("1 document deleted", obj);
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
