'use strict';
const net = require('net');
const Buffer = require('buffer').Buffer;
const tracker = require('./tracker');

module.exports = torrent => {
    tracker.getPeers(torrent, peers => {
        // peers.forEach(download);
        console.log(peers);
    })  
}

let download = (peer) => {
    const socket = net.Socket();
    socket.on('error', console.log);
    socket.connect(peer.port, peer.ip, () => {

    });
    socket.on('data', data => {

    });
}