const User = require("../models/Users");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

// --- LOGIN ---
async function handleLogIn(req, res) {
    const { email, pass } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.render("login", { error: "Incorrect Email or Password" });
        }

        const isMatch = await bcrypt.compare(pass, user.pass);
        if (!isMatch) {
            return res.render("login", { error: "Incorrect Email or Password" });
        }

        // create JWT token
        const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });

        res.cookie("token", token, {
            httpOnly: true,
            secure: false, // true in production with HTTPS
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return res.redirect("/dashboard");

    } catch (error) {
        console.error("Login error:", error);
        return res.render("login", { error: "Something went wrong!" });
    }
}

// --- SHOW SIGNUP PAGE ---
function handleSignUp(req, res) {
    return res.render("SignUp");
}

// --- CREATE USER ---
async function handleUserCreation(req, res) {
    const { fullName, email, pass } = req.body;

    try {
        // check if email already exists
        const existing = await User.findOne({ email });
        if (existing) {
            return res.render("SignUp", { error: "Email already exists!" });
        }

        // hash password
        const hashedPass = await bcrypt.hash(pass, 10);

        const user = await User.create({ fullName, email, pass: hashedPass });

        console.log("User created:", user.email);

        // create token automatically after signup
        const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });

        res.cookie("token", token, {
            httpOnly: true,
            secure: false,
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return res.redirect("/dashboard");

    } catch (error) {
        console.error("Signup error:", error);
        return res.render("SignUp", { error: "Something went wrong!" });
    }
}

module.exports = {
    handleLogIn,
    handleSignUp,
    handleUserCreation
};
