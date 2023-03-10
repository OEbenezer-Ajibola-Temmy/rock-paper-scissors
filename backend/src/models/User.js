const { model, Schema } = require("mongoose");

const userSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    username: {
        type: String,
        required: true,
        unique: true,
    },
    room_id: {
        type: String,
        required: false,
        default: "",
    },
    points: {
        type: Number,
        required: true,
        default: 0,
    },
});

module.exports = model("User", userSchema);
