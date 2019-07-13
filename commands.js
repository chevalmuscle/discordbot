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

async function playMusic({ message, voiceChannel }) {}

function addSound({ message }) {}

function deleteSound({ message }) {}

module.exports = commands;
