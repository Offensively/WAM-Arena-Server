const crypto = require("crypto");

class Player {
  constructor(username, skin, connection) {
    this.uuid = crypto.randomUUID();
    this.username = username;
    this.skin = skin;
    this.connection = connection;
  }

  disconnect() {
    this.connection.destroy();
  }
}

module.exports = Player;