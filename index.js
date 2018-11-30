'use strict';
const torrentParser = require('./src/torrent-parser');
const download = require('./src/download');
const torrent = torrentParser.open("sample.torrent");
download(torrent);