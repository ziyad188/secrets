require('dotenv').config();
const md5 = require("md5"); // add md5 where we need to hash syntax md5()
// const bcrypt = require("bcrypt"); npm package used for hashing and salting
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
// const encrypt = require("mongoose-encryption"); // to encrypt a field in database
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate')
const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
// const saltRounds = 10; // used for hasing and salting
app.use(session({
    secret:"i am ziyad",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
mongoose.connect("mongodb://localhost:27017/userDB");
const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String
});
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
// userSchema.plugin(encrypt, {secret:process.env.SECRET,encryptedFields:["password"]});
const User = new mongoose.model("user", userSchema);
passport.use(User.createStrategy());
passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  
  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIEND_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));
app.get("/", function(req,res){
    res.render("home");
});
app.get("/auth/google", 
    passport.authenticate("google",{ scope: ['profile']})
)
app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
   
    res.redirect('/secrets');
  });
app.get("/login",function(req,res){
    res.render("login");
});
app.get("/register", function(req,res){
    res.render("register");
});
app.get("/secrets", function(req,res){
    if(req.isAuthenticated()){
        res.render("secrets");
    }else{
        res.redirect("/login");
    }
})
app.get("/logout", function(req, res){
    req.logout();
    res.redirect("/");
})
app.post("/register", function(req,res){
    User.register({username: req.body.username},req.body.password,function(err,user){
        if(err){
            console.log(err);
            res.redirect("/register");
        } else{
            passport.authenticate("local")(req, res, function(){
                res.redirect("/secrets");
            })
        }
    })
});
app.post("/login", function(req,res){
    const user = new User({
        username: req.body.username,
        passwort: req.body.password
    });
    req.login(user, function(err){
        if(err){
            console.log(err);
        }else{
            passport.authenticate("local")(req,res, function(){
                res.redirect("/secrets");
            })
        }
    })
});

app.listen("3000", function(){
    console.log("server  started at port 3000");
});