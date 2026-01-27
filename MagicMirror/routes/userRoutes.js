const { Router } = require("express"); 
const {  handleLogIn, handleSignUp, handleUserCreation } = require("../controllers/user");

const routes = Router();


routes.get("/login", (req, res) => {
    res.render("login", {
        user: req.user,
    });
});

routes.post("/login", handleLogIn);

routes.get("/signup", handleSignUp);

routes.post("/signup", handleUserCreation);

module.exports = routes;