'use strict';
const fs = require('fs');
const bencode = require('bencode');
const tracker= require('./src/tracker');

const torrent = bencode.decode(fs.readFileSync('firstman.torrent'));

tracker.getPeers(torrent, peers => {
    console.log("peers are", peers);
})