'use strict';
const dgram = require('dgram');
const Buffer = require('buffer').Buffer;
const urlParse = require('url').parse;
const crypto = require('crypto');

//function to get peers for the torrent
let getPeers = (torrent, next) => {
    const socket = dgram.createSocket('udp4');
    const url = torrent.announce.toString('utf8');
    //send a udp request to tracker
    udpSend(socket, buildConnReq(), url);
    socket.on('message', response => {
       console.log(response);
    });
}

let udpSend = (socket, message, rawUrl) => {
    const url = urlParse(rawUrl);
    socket.send(message, 0, message.length, url.port, url.host);
}

function respType(resp) {
    // ...
}

//request message according to bep standard
function buildConnReq() {
    const buf = Buffer.alloc(16); 
    // connection id
    buf.writeUInt32BE(0x417, 0);
    buf.writeUInt32BE(0x27101980, 4);
    // action
    buf.writeUInt32BE(0, 8); // 4
    // transaction id
    crypto.randomBytes(4).copy(buf, 12); // 5
    return buf;
}

function parseConnResp(resp) {
    // ...
}

function buildAnnounceReq(connId) {
    // ...
}

function parseAnnounceResp(resp) {
    // ...
}

module.exports.getPeers = getPeers;