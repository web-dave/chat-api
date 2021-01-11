var WebSocket = require("ws");
var { v4: getID } = require("uuid");

var clients = [];

var rooms = {};

var wss = new WebSocket.Server({ port: 2222 });

wss.on("connection", function (client) {
  clients.push(client);
  var id = getID();
  client.uid = id;
  var msg = {
    type: "connection",
    message: "Welcome",
    id: id,
  };
  client.send(JSON.stringify(msg));

  client.on("close", function () {
    clients.forEach(function (c, i) {
      if (c === client) {
        clients.splice(i, 1);
      }
    });
    var roomIds = Object.keys(rooms);
    roomIds.forEach(function (rId) {
      if (rooms[rId].attendees.includes(client)) {
        var msg = {
          type: "leave",
          message: "Tschö mit Ö",
          id: client.uid,
        };
        rooms[rId].attendees.forEach(function (c) {
          if (c !== client) {
            c.send(JSON.stringify(msg));
          }
        });
        rooms[rId].attendees.forEach(function (c, i) {
          if (c === client) {
            clients.splice(i, 1);
          }
        });
        if (rooms[rId].attendees.length === 0) {
          delete rooms[rId];
        }
      }
    });
  });
  client.on("message", function (m) {
    var msg = JSON.parse(m);
    var room = msg.id;
    switch (msg.type) {
      case "connection":
        client.name = msg.message;
        break;
      case "message":
        console.log(client.name);
        msg.id = client.name;
        if (rooms[room]) {
          rooms[room].attendees.forEach(function (c) {
            c.send(JSON.stringify(msg));
          });
        }
        break;
      case "join":
        if (!rooms[room]) {
          rooms[room] = {
            name: "",
            host: client,
            attendees: [],
          };
        }
        rooms[room].attendees.push(client);

        rooms[room].attendees.forEach(function (c) {
          if (c !== client) {
            c.send(JSON.stringify(msg));
          }
        });
        break;
      case "available":
        if (rooms[room]) {
          msg.id = msg.message;
          rooms[room].attendees.forEach(function (c) {
            console.log("call", c.name);
            if (c !== client) {
              c.send(JSON.stringify(msg));
            }
          });
        }
        break;
      case "leave":
        break;
    }
  });
});
