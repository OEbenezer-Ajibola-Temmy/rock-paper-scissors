const Router = require("express").Router();
// controller
const { roomIOController } = require("../controllers/roomController");
// middleware
const { verifyUserToken } = require("../middlewares/auth");
const {
    handleDisconnect,
    verifyUserToken: verifySocketUserToken,
} = require("../middlewares/socket");

Router.use(verifyUserToken);

// Router.post("/create", createRoom);

exports.initializeRoomIO = (io, baseSocketUrl) => {
    io.of(`${baseSocketUrl}/room`, (socket) => {
        socket.on("disconnect", (payload) =>
            handleDisconnect(payload, socket, io)
        );
        roomIOController(io, socket);
    }).use(verifySocketUserToken);
};

exports.Router = Router;
