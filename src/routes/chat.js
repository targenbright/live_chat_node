"use strict";
const express = require('express');
var router = express.Router();
const database = require('../public/js/chat/liveChatDBFunctions')
const bcrypt = require("bcrypt");

// Input validation
const { check, validationResult} = require("express-validator");

// Common items to use between registration and login
var hash = require('../public/js/common/passwordHash');
const lengths = require('../public/js/common/acceptableLengths');
let sanitize = require('../public/js/common/sanitizeString.js');
const moment = require('moment-timezone');


/**
 * /PROJECTS/CHAT
 */

// GET
router
    .route("/")
    .get((req, res) => {
        console.log("new server")
        delete req.session.loggedin;
        delete req.session.emptyFields;
        delete req.session.notInDatabase;
        res.render("chat/chatInfo", {title:'Project: Live Chat'})
    });

/**
 * /PROJECTS/CHAT/LOGIN
 */

// GET
router
    .route("/login")
    .get((req, res) => {
        req.session.loggedin = false;
        // Check for empty 
        if (req.session.emptyFields) {
            delete req.session.emptyFields;
            res.render('chat/login', { 
                emptyFields: true,
                title:'Project: Live Chat',
                usernameMin: lengths.username.min,
                usernameMax: lengths.username.max,
                passwordMin: lengths.password.min,
                passwordMax: lengths.password.max 
            });
        }
        else if (req.session.notInDatabase) {
            delete req.session.notInDatabase;
            res.render('chat/login', { 
                notInDatabase: true,
                title:'Project: Live Chat',
                usernameMin: lengths.username.min,
                usernameMax: lengths.username.max,
                passwordMin: lengths.password.min,
                passwordMax: lengths.password.max 
            });
        }
        else {
            res.render('chat/login', {
                title:'Project: Live Chat',
                usernameMin: lengths.username.min,
                usernameMax: lengths.username.max,
                passwordMin: lengths.password.min,
                passwordMax: lengths.password.max
            });
        }
    });

// POST
router
    .route("/login")
    .post(async (request, response) => {
        var username = sanitize(request.body.username);
        var password = sanitize(request.body.password);
        if (username && password) {
            try {
                const account = await database.getUser(username);
                const pwdCheck = await bcrypt.compare(password, account[0].password);
                if (pwdCheck) {
                    // If the user is assigned a room, save that roomID in session storage
                    if (account[0].title === 'User' || account[0].title === 'Group Leader') {
                        const room = await database.getUserChatRoom(account[0].userID);
                        request.session.roomID = room[0].roomID;
                        response.cookie('roomID', request.session.roomID, {expires: new Date(Date.now() + 600000), httpOnly: true });
                        request.session.roomName = room[0].roomName;
                        request.session.title = account[0].title;
                    } else {
                        // roomID = 0 allows the room select page to trigger
                        request.session.roomID = 0;
                        request.session.title = account[0].title;
                    }
                    request.session.loggedin = true;
                    request.session.username = account[0].username;
                    request.session.userID = account[0].userID;
                    request.session.save(function(err){
                        if (err) {console.log(err)}
                    });
                    // Update login time in the database;
                    database.setLastLogin(account[0].userID, moment().tz("America/New_York").format('YYYY-MM-DD hh:mm:ss'));
                    //request.session.username = username;
                    response.cookie('username', username, {expires: new Date(Date.now() + 600000), httpOnly: true });
                    response.redirect('demo');
                }
                else {
                    request.session.notInDatabase = true;
                    response.render('chat/login', { notInDatabase: true });
                }
                
            } catch (error) {
                console.log(error);
                request.session.notInDatabase = true;
                response.render('chat/login', { notInDatabase: true })
            }
        } else {
            request.session.emptyFields = true;
            response.redirect('/projects/chat/login');
        } 
    });

/**
 * /PROJECTS/CHAT/SIGNUP
 */

// GET
router
    .route("/signup")
    .get((req, res) => {
        req.session.loggedin = false;
        res.render("chat/signup", {
            title:'Project: Live Chat',
            usernameMin: lengths.username.min,
            usernameMax: lengths.username.max,
            passwordMin: lengths.password.min,
            passwordMax: lengths.password.max
        });
    });

// POST
router
    .route("/signup")
    .post(
        [
            // Backend validation checks
            check("username", "Please Enter a Valid Username")
            .isLength({
                min: lengths.username.min,
                max: lengths.username.max,
            }),
            check("password", "Please enter a valid password").isLength({
                min: lengths.password.min,
                max: lengths.password.max,
            }),
            check("confirm").custom((value, { req }) => {
                if (value !== req.body.password) {
                  throw new Error('Password confirmation does not match password');
                }
                return true;
            }),
            check("userType").custom((value, { req }) => {
                if (value == "User type") {
                    throw new Error('Please select a user type');
                }
                return true;
            })
        ],
        async (req, res) => {

            //Get values from POST.
            // var {
            //     username,
            //     password,
            //     confirm,
            //     userType,
            //     ifUser,
            //     adminPass
            // } = req.body;

            var username = req.body.username;
            var password = req.body.password;
            var confirm = req.body.confirm;
            var userType = req.body.userType;
            var roomName;
            if (userType >= 3) {
                roomName = req.body.ifUser;
            } else {
                roomName = 0;
            }
            console.log(roomName);
            var adminPass = req.body.adminPass;

            // Sanitize username, password, and email
            username = sanitize(username);
            password = sanitize(password);
            confirm = sanitize(confirm);

            // Make sure entered parameters are valid
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                // Resend the user the registration page if invalid.
                return res.status(400).render('chat/signup', { 
                    msg: errors.errors[0].msg,
                    title:'Project: Live Chat',
                    usernameMin: lengths.username.min,
                    usernameMax: lengths.username.max,
                    passwordMin: lengths.password.min,
                    passwordMax: lengths.password.max
                    });
                }

            try {
                // Determine if the username already exists. Should return reject() if not taken
                if (await database.nameInDB(username)) {
                    res.status(400).render('chat/signup', { 
                        msg: 'Username already used by another user',
                        title:'Project: Live Chat',
                        usernameMin: lengths.username.min,
                        usernameMax: lengths.username.max,
                        passwordMin: lengths.password.min,
                        passwordMax: lengths.password.max
                    });
                }
                else if (adminPass != 'password') {
                    res.status(400).render('chat/signup', { 
                        msg: 'You are not an administrator',
                        title:'Project: Live Chat',
                        usernameMin: lengths.username.min,
                        usernameMax: lengths.username.max,
                        passwordMin: lengths.password.min,
                        passwordMax: lengths.password.max
                    });
                } else {
                    // Hash user's password
                    const hashedpwd = await hash(password);

                    await database.addUser(username, hashedpwd);
                    var userID = await database.getUserID(username);
                    await database.setUserRole(userID, userType);
                    if (roomName != 0) {
                        await database.setChatRoom(userID, roomName);
                    }
                    console.log(`${username} has been added`);
                    res.status(302).redirect('login');
                }
            } catch(error) {
                console.log('Error: ', error);
                res.status(500).send('Error in Saving');
            }
        });

/** 
 * /PROJECTS/CHAT/DEMO
 */

// GET
router
    .route("/demo")
    .get(async (req, res) => {
        try {
            // If user is not admin or moderator, send directly to assigned chat room
            if (req.session.loggedin && req.session.roomID != 0) {
                res.render('chat/chat', {
                    title:'Project: Live Chat',
                    loggedin: req.session.loggedin,
                    userTitle: req.session.title,
                    username: req.session.username, 
                    roomID: req.session.roomID,
                    userID: req.session.userID,
                    roomName: req.session.roomName
                });
            } else if (req.session.loggedin && req.session.roomID == 0) {

                // Create a list of all available chat rooms and allow admin or moderator to choose
                const roomList = await database.getAllChatRooms();
                req.session.choosing = true;
                res.render('chat/chatRoomSelect', {
                    title:'Project: Live Chat',
                    loggedin: req.session.loggedin,
                    userTitle: req.session.title,
                    username: req.session.username, 
                    userID: req.session.userID,
                    roomList: roomList
                });
            } else {
                // Not logged in... go log in.
                delete req.session.emptyFields;
                delete req.session.notInDatabase;
                res.redirect('login');
            }
        } catch(error) {
            console.log('Error: ', error);
            res.status(500).send("Error in choosing a room.");
        }
    });

// POST
router
    .route("/demo")
    .post(async (req, res) => {

        try {
            // If user is not admin or moderator, send directly to assigned chat room
            if (req.session.choosing) {
                delete req.session.choosing;
                // Pull chosen room
                req.session.roomID = req.body.roomSelect || 0;
                // req.session.roomName = req.body.roomSelect.text();
                const room = await database.getChatRoom(req.session.roomID);
                req.session.roomName = room[0].roomName;
                req.session.save(function(err){
                    if (err) {console.log(err)}
                });
                // Send chosen room
                if (req.session.roomID != 0) {
                    res.cookie('roomID', req.session.roomID, {expires: new Date(Date.now() + 600000), httpOnly: true });
                    res.render('chat/chat', {
                        title:'Project: Live Chat',
                        loggedin: req.session.loggedin,
                        userTitle: req.session.title,
                        username: req.session.username, 
                        roomID: req.session.roomID,
                        userID: req.session.userID,
                        roomName: req.session.roomName
                    });
                } else {
                    res.redirect('login');
                }
            } else {
                res.redirect('login');
            }
        } catch (error) {
            console.log('Error: ', error);
            res.status(500).send("Error in choosing a room.");
        }
    });

module.exports = router;