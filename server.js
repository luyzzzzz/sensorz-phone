const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const path = require("path");

const PORT = 8080;

// --------------------------------------------------
// SERVEUR HTTP
// --------------------------------------------------

const app = express();

app.use(
    express.static(
        path.join(__dirname, "public")
    )
);

const server = http.createServer(app);

// --------------------------------------------------
// SERVEUR WEBSOCKET
// --------------------------------------------------

const wss = new WebSocket.Server({
    server
});

console.log("=================================");
console.log("CoMote Particle Server");
console.log("=================================");

// --------------------------------------------------
// CONNEXIONS
// --------------------------------------------------

wss.on("connection", function(ws, request) {

    const ip =
        request.socket.remoteAddress;

    console.log(
        "Nouvelle connexion WebSocket :",
        ip
    );

    ws.on("message", function(message) {

        console.log(
            "Message reçu :",
            message.toString()
        );

        // --------------------------------------------------
        // REDISTRIBUTION
        // --------------------------------------------------

        wss.clients.forEach(function(client) {

            if (
                client !== ws &&
                client.readyState === WebSocket.OPEN
            ) {

                client.send(
                    message.toString()
                );

            }

        });

    });

    ws.on("close", function() {

        console.log(
            "Connexion fermée :",
            ip
        );

    });

    ws.on("error", function(error) {

        console.error(
            "Erreur WebSocket :",
            error
        );

    });

});

// --------------------------------------------------
// SERVEUR
// --------------------------------------------------

server.listen(PORT, "0.0.0.0", function() {

    console.log("");
    console.log(
        `Serveur HTTP : http://localhost:${PORT}`
    );

    console.log(
        `WebSocket : ws://localhost:${PORT}`
    );

    console.log("");
    console.log(
        "Pour le téléphone, utiliser l'adresse IP"
    );

    console.log(
        "de cet ordinateur sur le réseau local."
    );

});