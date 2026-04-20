'use strict';

const { getPartner } = require('./room');
const logger = require('../utils/logger');

/**
 * Forward a WebRTC signaling payload to the partner in the same room.
 * If partner is gone, emits 'stranger_disconnected' back to the sender.
 *
 * @param {import('socket.io').Server}  io
 * @param {import('socket.io').Socket}  socket    - The socket sending the signal
 * @param {string}                      roomId
 * @param {string}                      event     - 'webrtc_offer' | 'webrtc_answer' | 'webrtc_ice_candidate'
 * @param {object}                      payload
 */
async function forwardSignal(io, socket, roomId, event, payload) {
  try {
    const partnerId = await getPartner(roomId, socket.id);

    if (!partnerId) {
      socket.emit('stranger_disconnected');
      return;
    }

    const partnerSocket = io.sockets.sockets.get(partnerId);
    if (!partnerSocket) {
      logger.warn(`forwardSignal: partner ${partnerId} not connected, event=${event}`);
      socket.emit('stranger_disconnected');
      return;
    }

    partnerSocket.emit(event, payload);
  } catch (err) {
    logger.error(`forwardSignal error [${event}]:`, err.message);
  }
}

module.exports = { forwardSignal };
