// utils
const { verifyToken } = require("../utils/models/users");

exports.handleDisconnect = async (payload, socket, io) => {
    // emit to room that werey don go disconnect
    console.log("werey don go disconnect 🤦‍♂️");
    return;
};

exports.verifyUserToken = async (socket, next) => {
    const { authorization } = socket.handshake.headers;

    if (!authorization) {
        return next(
            constructErrorMessage(
                "No authorization token was provided. Set Authorization ` Bearer {{token}}` in Header.",
                400
            )
        );
    }
    const [_, signed_token] = authorization.split(" ");
    console.log({ signed_token });
    const user = verifyToken(signed_token);
    socket.user = user;
    next();
};
