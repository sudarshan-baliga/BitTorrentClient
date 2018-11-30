'use strict';
const net = require('net');
const Buffer = require('buffer').Buffer;
const tracker = require('./tracker');
const message = require('./message');
const Pieces = require('./pieces');
const Queue = require('./Queue');
const fs = require("fs");

module.exports = (torrent, path) => {
    tracker.getPeers(torrent, peers => {
        // peers.forEach(download);
        console.log(peers);
        //torrent will have 20byte hash for each piece
        const pieces = new Pieces(torrent.info.pieces.length / 20);
        const file = fs.openSync(path, 'w');
        peers.forEach(peer => download(peer, torrent, pieces));
    })
}

let download = (peer, torrent, pieces) => {
    const socket = net.Socket();
    socket.on('error', console.log);
    socket.connect(peer.port, peer.ip, () => {
        socket.write(message.buildHandshake(torrent));
    });
    const queue = new Queue(torrent);
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
    const pieceIndex = payload.readUInt32BE(0);
    const queueEmpty = queue.length === 0;
    queue.queue(pieceIndex);
    if (queueEmpty) requestPiece(socket, pieces, queue);
}

function bitfieldHandler(socket, pieces, queue, payload) {
    const queueEmpty = queue.length === 0;
    payload.forEach((byte, i) => {
        for (let j = 0; j < 8; j++) {
            if (byte % 2) queue.queue(i * 8 + 7 - j);
            byte = Math.floor(byte / 2);
        }
    });
    if (queueEmpty) requestPiece(socket, pieces, queue);
}

function pieceHandler(socket, pieces, queue, torrent, file, pieceResp) {
    console.log(pieceResp);

    pieces.addReceived(pieceResp);

    // write to file here...
    const offset = pieceResp.index * torrent.info['piece length'] + pieceResp.begin;
    fs.write(file, pieceResp.block, 0, pieceResp.block.length, offset, () => {});

    if (pieces.isDone()) {
        socket.end();
        console.log('DONE!');
        try {
            fs.closeSync(file);
        } catch (e) {}

    } else {
        requestPiece(socket, pieces, queue);
    }
}

function requestPiece(socket, queue) {
    if (queue.choked) return null;
    while (queue.length()) {
        const pieceBlock = queue.deque();
        if (pieces.needed(pieceBlock)) {
            socket.write(message.buildRequest(pieceBlock));
            pieces.addRequested(pieceBlock);
            break;
        }
    }
}