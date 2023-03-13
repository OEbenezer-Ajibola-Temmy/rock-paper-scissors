const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { User } = require("../../models");

exports.hashPassword = async (password, salt) => {
    /**
     *
     */
    return await bcrypt.hash(password, salt);
};

exports.comparePassword = async (password, hashedPassword) => {
    /**
     *
     */
    return await bcrypt.compare(password, hashedPassword);
};

exports.createUser = async (payload) => {
    /**
     *
     */
    let { email, password, username } = payload;
    let response = { data: {}, error: "", success: false };

    try {
        let data = await User.create({
            email,
            password,
            username,
            room_id: "",
            points: 0,
        });
        response = { ...response, data, success: true };
    } catch (error) {
        response = {
            ...response,
            success: false,
            error: JSON.stringify(error),
        };
    } finally {
        return response;
    }
};

exports.findOneUser = async (payload) => {
    /**
     *
     */
    let { email } = payload;
    let response = { data: {}, error: "", success: false };
    try {
        let data = await User.findOne(
            { email },
            { _id: 1, email: 1, username: 1, password: 1 }
        );
        response = { ...response, data, success: true };
    } catch (error) {
        response = { ...response, error: JSON.stringify(error) };
    } finally {
        return response;
    }
};

exports.signToken = (payload) => {
    return jwt.sign(payload, JWT_SECRET_KEY, { expiresIn: "5mins" });
};
