const Router = require("express").Router();
// controllers
const { getUsersController } = require("../controllers/userController");

Router.get("/", getUsersController);

module.exports = Router;
