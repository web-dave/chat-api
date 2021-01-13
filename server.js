const WebSocket = require("ws");
const { v4: getID } = require("uuid");
const http = require("http");
const express = require("express");
const app = express();
const port = process.env.PORT || 5000;

app.use(express.static(__dirname + "/"));

const server = http.createServer(app);
server.listen(port);

const clients = [];

const rooms = {};

const wss = new WebSocket.Server({ port: 2233 });

wss.on("connection", (client) => {
  clients.push(client);
  const id = getID();
  client.uid = id;
  const msg = {
    type: "connection",
    message: "Welcome",
    id: id,
  };
  client.send(JSON.stringify(msg));

  client.on("close", () => {
    clients.forEach((c, i) => {
      if (c === client) {
        clients.splice(i, 1);
      }
    });
    const roomIds = Object.keys(rooms);
    roomIds.forEach((rId) => {
      if (rooms[rId].attendees.includes(client)) {
        const msg = {
          type: "leave",
          message: "Tschö mit Ö",
          id: client.uid,
        };
        rooms[rId].attendees.forEach((c) => {
          if (c !== client) {
            c.send(JSON.stringify(msg));
          }
        });
        rooms[rId].attendees.forEach((c, i) => {
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
  client.on("message", (m) => {
    const msg = JSON.parse(m);
    const room = msg.id;
    switch (msg.type) {
      case "connection":
        client.name = msg.message;
        break;
      case "message":
        console.log(client.name);
        msg.id = client.name;
        if (rooms[room]) {
          rooms[room].attendees.forEach((c) => {
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

        rooms[room].attendees.forEach((c) => {
          if (c !== client) {
            c.send(JSON.stringify(msg));
          }
        });
        break;
      case "available":
        if (rooms[room]) {
          msg.id = msg.message;
          rooms[room].attendees.forEach((c) => {
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
