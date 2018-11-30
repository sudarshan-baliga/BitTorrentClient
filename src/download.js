'use strict';
const net = require('net');
const Buffer = require('buffer').Buffer;
const tracker = require('./tracker');
const message = require('./message');
const requested = []; //reqeusted pieces

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
    const queue = [];
    onWholeMsg(socket, data => {
        msgHandler(data, socket, queue);
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

let msgHandler = (msg, socket, queue) => {
    if (isHandshake(msg)) socket.write(message.buildInterested());
    else {
        const m = message.parse(msg);
        if (m.id == 0) chokeHandler();
        if (m.id === 1) unchokeHandler();
        if (m.id === 4) haveHandler(m.payload, socket, queue);
        if (m.id === 5) bitfieldHandler(m.payload);
        if (m.id === 7) pieceHandler(m.payload, socket, queue);
    }
}

function isHandshake(msg) {
    return msg.length === msg.readUInt8(0) + 49 &&
        msg.toString('utf8', 1) === 'BitTorrent protocol';
}

function chokeHandler() {}

function unchokeHandler() {}

function haveHandler(payload, socket, queue) {
    const pieceIndex = payload.readInt32BE(0);
    q
    queue.push(pieceIndex);
    //do request only after getting response i.e one request at a time
    if (queue.length === 1) {
        requestPiece(socket, queue);
    }
    // requested[pieceIndex] = true;

}

function bitfieldHandler(payload) {}

function pieceHandler(payload) {}

function requestPiece(socket, queue) {
    //check if already requested
    if (requested[queue[0]]) {
        queue.shift();
    } else {
        socket.write(message.buildRequest(pieceIndex));
    }
}