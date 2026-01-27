const { validateUser } = require("../services/auth");

function checkForAuthMid(cookieName) {
    return (req, res, next) => {
        console.log("middleware activated");
        
        const tokenValue = req.cookies[cookieName];

        if (!tokenValue) {
            req.user=null;
           return next();
        }

        try {
            const userPayload = validateUser(tokenValue);
            console.log("Payload Created..");
            
            req.user = userPayload;
        } catch (error) {console.log(error);};
        
        return next();
    }
}

function requireAuth(req, res, next) {
    if (!req.user) {
        return res.redirect("/user/login");
    }
    next();
}

module.exports = { checkForAuthMid , requireAuth };