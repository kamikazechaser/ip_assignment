const Socket = require("ws");
const rangi = require("rangi");
const fs = require("fs");

const router = new Socket.Server({ port: 9000 });

let id = 0;
let connectedNode = {};

/**
 *
 * every node has its own routing table
 *
 * objectKey: source
 * objectValue: [nextHop, destination]
 *
 * A;0 B;1 C;2 D;3
 *
 * A - B
 * B - C
 * B - D
 *
 * -1 prevents self message
 *
 */


const routingTables = {
    0: {
        0: [-1],
        1: [1, 1],
        2: [1, 2],
        3: [1, 3]
    },
    1: {
        0: [0, 0],
        1: [-1],
        2: [2, 2],
        3: [3, 3]
    },
    2: {
        0: [1, 0],
        1: [1, 1],
        2: [-1],
        3: [1, 3]
    },
    3: {
        0: [1, 0],
        1: [1, 1],
        2: [1, 2],
        3: [-1]
    }
}

router.on("connection", (socket) => {
    socket.id = id++;
    connectedNode[socket.id] = socket;

    console.log(`${socket.id} joined the network`);
    socket.send(`node:${socket.id}`);

    // routing handler
    socket.on("message", (msg) => {
        const source = socket.id;
        const type = msg.split(":")[0];
        const destination = msg.split(":")[1];
        const message = msg.split(":")[2];
        let forwardTo;

        const trace = lookupRoutingTable(source, destination);

        trace.error ? console.log(rangi.red("cannot message to self")) : forwardTo = connectedNode[trace.dest];

        if (forwardTo) {
            if (trace.pass) {
                let passThru = connectedNode[trace.pass];
                passThru.send(rangi.yellow("forwarding onwards"));
            }
            if (type === "txt") {
                fs.writeFile(`${destination}/rawwrite.txt`, message, (error) => {
                    if (error) console.log("error wrtiting file");
                    return forwardTo.send(`${socket.id}:txt file written`);
                });
            }
            if (type === "send") {
                fs.readFile(message, (error, data) => {
                    if (error) console.log("error reading file");
                    fs.writeFile(`${destination}/received.${message.split("."[1])}`, data, (error) => {
                        if (error) console.log("error wrtiting file from remote");
                        return forwardTo.send(`${socket.id}:received file`);
                    });
                })
            }
            if (type === "msg") {
                return forwardTo.send(`${socket.id}:${message}`);
            }
        }
    });

    // gracefully remove a node from the network
    socket.on("close", () => {
        delete connectedNode[socket.id];
        console.log(rangi.yellow("node disconnected"));
    });
});

// forwarding logic by looking up routing table
function lookupRoutingTable(source, destination) {
    const path = routingTables[source][destination];
    const obj = {};

    if (source === destination) {
        obj.error = true;
    } else if (path[0] === path[1]) {
        obj.dest = path[0];
    } else {
        obj.pass = path[0];
        obj.dest = path[1];
    }

    return obj;
}