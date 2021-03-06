var net = require("net")
const Player = require("./player.js");
var port = 443;

var server = net.createServer();

let queue = [];
let allPlayers = [];
let playersInGame = [];
let isGameRunning = false;

function bufferToArray(buffer) {
    let bufArrTemp = buffer.toString('utf8', 5).split('|')
    let bufArr = []
    for (var i = 0; i < bufArrTemp.length; i++) {
        bufArr.push(bufArrTemp[i].replace(' ', '').replace('(', '').replace('����\fPlayerMoveEvent', '').replace('!', '').replace('\t', '').replaceAll('#','').replaceAll('\x00','').replaceAll('\x19','').replaceAll('\x1F','').replaceAll('\x1C','').replaceAll('\x1E','').replaceAll('\x1B','').replaceAll('\x18','').replaceAll('\x1A', '').replaceAll('\x0B', ''))
    }
    return bufArr;
}

function updateQueue() {
    for (var i = 0; i < queue.length; i++) {
        const player = queue[i]
        
        var buf = Buffer.from("QueueUpdate|" + (queue.indexOf(player) / 2).toString().replace('.5', ''));
        try {
            player.connection.write(buf);
        } catch (e) {
            console.log("Player did not gracefully close the connection!");
            removePlayerFromGame(player);
        }
    }
}

function checkQueue() {
    if (!isGameRunning && queue.length >= 2) {
        isGameRunning = true;
        let p1 = queue[0];
        let p2 = queue[1];
        p1.setInGame(true);
        p2.setInGame(true);
        console.log("New Game with "+p1.username+" and "+p2.username+"!")
        var buf;

        buf = Buffer.from("GameStart|" + p2.username + "|" + p2.skin + "|1");
        p1.connection.write(buf);
        buf = Buffer.from("GameStart|" + p1.username + "|" + p1.skin + "|2");
        p2.connection.write(buf);

        playersInGame.push(p1);
        playersInGame.push(p2);
    }
    updateQueue();
}

function getPlayerBySocket(socket) {
    for (var i = 0; i < allPlayers.length; i++) {
        const player = allPlayers[i]
        if (player.connection.address == socket.address) {
            return player;
        }
    }
}

function removePlayerFromGame(player) {
    let allPlayersTemp = [];
    for (var i = 0; i < allPlayers.length; i++) {
        const p = allPlayers[i]
        if (p.uuid != player.uuid) {
            allPlayersTemp.push(p)
        }
    }
    allPlayers = allPlayersTemp

    let queueTemp = [];
    for (var i = 0; i < queue.length; i++) {
        const p = queue[i]
        if (p.uuid != player.uuid) {
            queueTemp.push(p)
        }
    }
    queue = queueTemp

    if (player.isInGame()) {
        playersInGame = [];
        isGameRunning = false;
    }

    checkQueue();
}

server.on("connection", function(socket) {
    var buf = Buffer.from("JoinDataRequest");
    socket.write(buf);

    console.log("New Connection!")

    socket.on("data", function(data) {
        const bufArr = bufferToArray(data)
        const header = bufArr[0]
        console.log(bufArr)
        let player;
        switch (header) {
            case "JoinDataResponse":
                player = new Player(bufArr[1], bufArr[2], socket);
                allPlayers.push(player);
                queue.push(player);
                checkQueue();
                break;
            case "Disconnect":
                player = getPlayerBySocket(socket)
                console.log("Player disconnected!")
                removePlayerFromGame(player);
                break;
            case "PlayerMoveEvent":
                // player is the player to send buffer to
                if (playersInGame[0].connection.address() == socket.address()) {
                    player = playersInGame[1]
                } else {
                    player = playersInGame[0]
                }
                player.connection.write(data);
                break;
            case "GameLose":
                // player is the player to send buffer to
                if (playersInGame[0].connection.address() == socket.address()) {
                    player = playersInGame[1]
                } else {
                    player = playersInGame[0]
                }
                buf = Buffer.from("GameWon")
                player.connection.write(buf);
                break;
        }
    });

    socket.once("closed", function() {
        console.log("Lost Connection");
    });

    socket.on('error', (err) => {
        if (err.name == "Error: read ECONNRESET") {
            console.log("Player did not gracefully close the connection!");
            removePlayerFromGame(getPlayerBySocket(socket));
        }
    })
});

server.listen(port, function () {
    console.log("WAM Arena Server started successfully.");
});