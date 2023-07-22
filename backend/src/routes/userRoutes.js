const Router = require("express").Router();
const passport = require("passport");
// controllers
const {
    getUsersController,
    signInGoogleInit,
    signInGoogleCallback,
    signInUserController,
    signUpUserController,
} = require("../controllers/userController");

// initialize google authentication
signInGoogleInit(passport);
Router.get("/", getUsersController)
    .get(
        "/google/sign-in",
        passport.authenticate("google", { scope: ["email", "profile"] })
    )
    .get(
        "/google/callback",
        passport.authenticate("google", { session: false }),
        signInGoogleCallback
    )
    .post("/sign-in", signInUserController)
    .post("/sign-up", signUpUserController);

module.exports = Router;
