// utils
const { verifyToken } = require("../utils/models/users");

exports.verifyUserToken = (req, res, next) => {
    try {
        /**
         headers: {
            ...,
            authorization: 'Bearer <token>',
         }
         */
        console.log("I got here");
        const [_, signed_token] = req.headers["authorization"].split(" ");
        console.log({ signed_token });
        const user = verifyToken(signed_token);
        req.user = user;
        next();
    } catch (error) {
        next(error);
    }
};
