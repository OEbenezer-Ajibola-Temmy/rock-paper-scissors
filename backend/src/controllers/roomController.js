// events
const {
    events: { CREATE_ROOM, JOIN_ROOM },
    functions: { createRoomHandler, joinRoomHandler },
} = require("./events/listeners");

exports.roomIOController = (io, socket) => {
    socket.on(CREATE_ROOM, (payload) => createRoomHandler(payload, socket, io));

    socket.on(JOIN_ROOM, (payload) => joinRoomHandler(payload, socket, io));
};
