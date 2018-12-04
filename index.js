'use strict';
const torrentParser = require('./src/torrent-parser');
const download = require('./src/download');
const torrent = torrentParser.open("sample3.torrent");
download(torrent,  torrent.info.name);