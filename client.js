const readline = require("readline");
const WebSocket = require("ws");
const rangi = require("rangi");
const fs = require("fs");

const ws = new WebSocket("ws://127.0.0.1:9000");
const stdin = readline.createInterface(process.stdin, process.stdout);

ws.on("open", () => {
    console.log(rangi.yellow("connected to network"));
    stdin.setPrompt("");
    stdin.prompt();
    stdin.on("line", (line) => {
        if (line === "exit") stdin.close();
        ws.send(line);
        stdin.prompt();
    }).on("close", () => {
        ws.terminate();
        process.exit(0);
    });
});

ws.on("message", (msg) => {
    console.log(rangi.green(msg));
});

