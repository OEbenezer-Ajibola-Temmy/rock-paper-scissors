module.exports = {
    socketRoutes: {
        initializeRoomIO: require("./roomRoutes").initializeRoomIO,
    },
    roomRoutes: require("./roomRoutes").Router,
    userRoutes: require("./userRoutes"),
};
