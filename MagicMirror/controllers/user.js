const User = require("../models/Users")


async function handleLogIn(req, res) {

    const { email, pass } = req.body;
    console.log(email,pass);

    try {
        const token = await User.matchPass(email, pass);

        if (token) {
            console.log("cookie created");
            return res.cookie("token",token,{
                httpOnly: true,
                secure: false, // true in production with HTTPS
                maxAge: 7 * 24 * 60 * 60 * 1000
            }).redirect("/");
        }
    } catch (error) {
        console.log("error in cookie creation...");
        console.log(error);
        return res.render("login",{
            error: 'Incorrect Email or Password',
            user: req.user,
        });
    }
}

function handleSignUp(req, res) {
    return res.render("SignUp");
}

async function handleUserCreation(req, res) {

    const { fullName, email, pass } = req.body;

    await User.create({ fullName, email, pass });

    console.log(`user created : ${User}`);
    

    return res.redirect("/");
}


module.exports = {
    handleLogIn,
    handleSignUp,
    handleUserCreation
} 