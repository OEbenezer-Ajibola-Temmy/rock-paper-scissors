const Router = require("express").Router();
// controller
const {
    signInController,
    signUpController,
} = require("../controllers/userController");

Router.post("/sign-in", signInController).post("/sign-up", signUpController);

module.exports = Router;
