'use strict';
const fs = require('fs');
const bencode = require('bencode');
const tracker= require('./src/tracker');
const torrentParser = require('./src/torrent-parser');

const torrent = torrentParser.open('sample.torrent');

tracker.getPeers(torrent, peers => {
    console.log("peers are", peers);
})