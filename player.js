const crypto = require("crypto");

class Player {
  constructor(username, skin, connection) {
    this.uuid = crypto.randomUUID();
    this.username = username;
    this.skin = skin;
    this.connection = connection;
    this.inGame = false;
  }

  disconnect() {
    this.connection.destroy();
  }

  setInGame(inGame) {
    this.inGame = inGame;
  }

  isInGame() {
    return this.inGame;
  }
}

module.exports = Player;