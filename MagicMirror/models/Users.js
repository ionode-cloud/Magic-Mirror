const {Schema, model} = require("mongoose");
const { createHmac, randomBytes } = require('node:crypto'); 
const { createTokens } = require("../services/auth");

const userSchema = new Schema({
    fullName : {
        type : String,
        required : true,
    },
    email : {
        type : String,
        required : true, 
        unique : true,
    },
    salt : {
        type : String,
    },
    pass : {
        type : String,
        required : true,
    },
    profImg : {
        type : String,
        default  : "Public/images/istockphoto-1337144146-612x612.jpg"
    },
    role : {
        type : String,
        enum : [ "Admin","User"],
        default : "User",
    }
},{timestamps : true},{createdBy : true});

userSchema.pre("save", function (next){
    const user = this;

    if(!user.isModified("pass")) return;

    const salt = randomBytes(16).toString();
    const HashPass = createHmac("sha256",salt).update(user.pass).digest("hex");

    this.salt = salt;
    this.pass = HashPass;

    next();
});

userSchema.static('matchPass',async function matchPass(email,pass) {
    const user = await this.findOne({email : email});
    console.log(user.fullName);
    const token = createTokens(user);

    if (!user) return false;

    const salt = user.salt;
    const HashPass = user.pass;

    const userProvPass = createHmac("sha256",salt).update(pass).digest('hex');
    
    if(HashPass === userProvPass) return token;

    console.log("error occured...")
   throw new Error();
    
})

const User = model("user",userSchema);

module.exports = User;