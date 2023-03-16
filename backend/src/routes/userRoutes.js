const Router = require("express").Router();
// controllers
const {
    getUsersController,
    signUpUserController,
} = require("../controllers/userController");

Router.get("/", getUsersController).post("/sign-up", signUpUserController);

module.exports = Router;
