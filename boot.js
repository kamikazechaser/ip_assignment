const terminal = require("child_process");
const fs = require("fs");

terminal.spawn("node", ["network.js"], {
    detached: true,
    shell: true
});

for (let i = 0; i < 4; i++) {
    terminal.spawn("node", ["client.js"], {
        detached: true,
        shell: true
    });

    let dir = `./${i}`;
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir);
    }
}