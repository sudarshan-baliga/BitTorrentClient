'use strict';
const torrentParser = require('./src/torrent-parser');
const download = require('./src/download');
const fs = require('fs');
if(process.argv.length < 3)
    console.log("provide the magnet link\nformat: node index.js <name>.torrent");
else{
    const file = process.argv[2];
    if(!fs.existsSync(file)){
        console.log(file + " does not exist");
        process.exit(1);
    }
    console.log("downloading torrent " + file + "\n");
    const torrent = torrentParser.open(file);
    download(torrent,  torrent.info.name);
}