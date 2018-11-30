'use strict';
// https://wiki.theory.org/index.php/BitTorrentSpecification#Handshake

const Buffer = require('buffer').Buffer;
const torrentParser = require('./torrent-parser');
const util = require('./util')

module.exports.buildHandshake = torrent => {
    const buff = Buffer.alloc(68);
    //pstrlen 
    buff.writeUInt8(19, 0);
    //pstr 'identifier of the protocol'
    buff.write('BitTorrent protocol', 1);
    //reserved 8 bytes default is 0
    buff.writeUInt32BE(0, 20);
    buff.writeUInt32BE(0, 24);
    //info hash
    torrentParser.infoHash(torrent).copy(buff, 28);
    //peer id 
    buff.write(util.genId());
    return buf;
}

module.exports.buildKeepAlive = () => Buffer.alloc(4);

module.exports.buildChoke = () => {
    const buf = Buffer.alloc(5);
    //length
    buff.writeUInt32BE(1, 0);
    //id 
    buf.writeUInt8(0, 4);
    return buf;
}

module.exports.buildUnchoke = () => {
    const buf = Buffer.alloc(5);
    //length
    buf.writeInt32BE(1, 0);
    //id 
    buf.writeUInt8(1, 4);
}

module.exports.buildIntrested = () => {
    const buf = Buffer.alloc(5);
    //length
    buf.writeInt32BE(1, 0);
    //id
    buf.writeInt8(2, 4);
    return buf;
}

module.exports.buildUnintrested = () => {
    const buf = Buffer.alloc(5);
    //length
    buf.writeInt32BE(1, 0);
    //id
    buf.writeInt8(3, 4);
    return buf;
}

module.exports.buildHave = payload => {
    const buf = Buffer.alloc(9);
    //legth
    buf.writeInt32BE(5, 0);
    //id
    buf.writeUInt8(4, 4);
    //piece Index 
    buf.writeUInt32BE(payload, 5);
    return buf;
}

module.exports.buildBitfield = bitfield => {
    const buf = Buffer.alloc(14);
    // length
    buf.writeUInt32BE(bitfield.length + 1, 0);
    // id
    buf.writeUInt8(5, 4);
    // bitfield
    bitfield.copy(buf, 5);
    return buf;
};


module.buildRequest = payload => {
    const buf = Buffer.alloc(17);
    //length
    buf.writeInt32BE(13, 0);
    //id 
    buf.writeUInt8(6, 4);
    //piece index
    buf.writeUInt32BE(payload.index, 5);
    //begin
    buf.writeUInt32BE(payload.begin, 9);
    //length
    buf.writeUInt32BE(payload.length, 13);
    return buf;
}

module.exports.buildCancel = payload => {
    const buf = Buffer.alloc(17);
    //legnth
    buf.writeUInt32BE(13, 0);
    //id 
    buf.writeUInt8(8, 4);
    //piece index
    buf.writeUInt32BE(payload.index, 5);
    //begin
    buf.writeUInt32BE(payload.begin, 9);
    //length
    buf.writeUInt32BE(payload.length, 13);
    return buf;
}

module.exports.buildPort = payload => {
    const buf = Buffer.alloc(7);
    //length
    buf.writeInt32BE(3, 0);
    //id
    buf.writeUInt8(9, 4);
    //listen port
    buf.writeUInt16BE(payload, 5);
    return buf;
}



module.exports.parse = msg => {
    const id = msg.length > 4 ? msg.readUInt8(4) : null;
    let payload = msg.length > 5 ? msg.slice(5) : null;
    if (id == 6 || id == 7 || id == 8) {
        const res = payload.slice(8);
        payload = {
            index: payload.readInt32BE(0),
            begin: payload.readInt32BE(4)
        };
        payload[id == 7 ? 'block' : 'length'] = rest;
    }
    return {
        size: msg.readInt32BE(0),
        id: id,
        payload: payload
    }
};