'use strict';
const net = require('net');
const Buffer = require('buffer').Buffer;
const tracker = require('./tracker');
const message = require('./message');
const Pieces = require('./pieces');

module.exports = torrent => {
    tracker.getPeers(torrent, peers => {
        // peers.forEach(download);
        console.log(peers);
        //torrent will have 20byte hash for each piece
        const pieces = new Pieces(torrent.info.pieces.length / 20);
        peers.forEach(peer => download(peer, torrent, pieces));
    })
}

let download = (peer, torrent, pieces) => {
    const socket = net.Socket();
    socket.on('error', console.log);
    socket.connect(peer.port, peer.ip, () => {
        socket.write(message.buildHandshake(torrent));
    });
    const queue = {
        choked: true,
        queue: []
    };
    onWholeMsg(socket, data => {
        msgHandler(data, socket, pieces, queue);
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

let msgHandler = (msg, socket, pieces, queue) => {
    if (isHandshake(msg)) socket.write(message.buildInterested());
    else {
        const m = message.parse(msg);
        if (m.id === 0) chokeHandler(socket);
        if (m.id === 1) unchokeHandler(socket, pieces, queue);
        if (m.id === 4) haveHandler(m.payload);
        if (m.id === 5) bitfieldHandler(m.payload);
        if (m.id === 7) pieceHandler(m.payload);
    }
}

function isHandshake(msg) {
    return msg.length === msg.readUInt8(0) + 49 &&
        msg.toString('utf8', 1) === 'BitTorrent protocol';
}

function chokeHandler(socket) {
    //this peer fucked us
    socket.end();
}

function unchokeHandler(socket, pieces, queue) {
    queue.choked = false;
    requestPiece(socket, pieces, queue);
}

function haveHandler(payload, socket, queue) {
    const pieceIndex = payload.readInt32BE(0);
    queue.push(pieceIndex);
    //do request only after getting response i.e one request at a time
    if (queue.length === 1) {
        requestPiece(socket, queue);
    }
}

function bitfieldHandler(payload) {}

function pieceHandler(payload) {}

function requestPiece(socket, queue) {
    if (queue.choked) return null;
    while (queue.queue.length) {
        const pieceIndex = queue.shift();
        if (pieces.needed(pieceIndex)) {
            socket.write(message.buildRequest(pieceIndex));
            pieces.addRequested(pieceIndex);
            break;
        }
    }
}