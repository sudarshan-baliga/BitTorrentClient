'use strict';
const net = require('net');
const Buffer = require('buffer').Buffer;
const tracker = require('./tracker');
const message = require('./message');

module.exports = torrent => {
    tracker.getPeers(torrent, peers => {
        // peers.forEach(download);
        console.log(peers);
        peers.forEach(peer => download(peer, torrent));
    })
}

let download = (peer, torrent) => {
    const socket = net.Socket();
    socket.on('error', console.log);
    socket.connect(peer.port, peer.ip, () => {
        socket.write(message.buildHandshake(torrent));
    });
    onWholeMsg(socket, data => {
        msgHandler(data, socket);
    });
}

let onWholeMsg = (socket, callback) => {
    //since we wont get the whole message read till required length is reached
    let savedBuf = Buffer.alloc(0);
    let handshake = true;
    socket.on("data", recBuf => {
        const msgLen = () => handshake ? savedBuf.readUInt8(0) + 49 : savedBuf.readInt32BE(0) + 4;
        savedBuf = Buffer.concat([savedBuf, recvBuf]);
        //wont go into while loop until entire message is received
        while (savedBuf.length >= 4 && savedBuf.length >= msgLen()) {
            callback(savedBuf.slice(0, msgLen()));
            savedBuf = savedBuf.slice(msgLen());
            handshake = false;
        }
    })
}

let msgHandler = (msg, socket) => {
    if (isHandshake(msg)) socket.write(message.buildInterested());
}

function isHandshake(msg) {
    return msg.length === msg.readUInt8(0) + 49 &&
        msg.toString('utf8', 1) === 'BitTorrent protocol';
}