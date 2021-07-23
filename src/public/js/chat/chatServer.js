var database = require('./liveChatDBFunctions');
const momentTZ = require('moment-timezone');
const {
    userJoin,
    getCurrentUser,
    userLeave,
    getRoomUsers,
    findUser
  } = require('./users');

module.exports = {runSocketIO};

// Start Socket.io on the webserver
function runSocketIO (server) {
    const socketio = require('socket.io');
    const io = socketio(server);

    // When any user connects through 'var socket = io();' give them a socket
    io.on('connection', async (socket) => {

        try {
            // When a user joins, collect their information
            socket.on('user join', async (username, roomName) => {

                // If the user is already connected
                if (findUser(username)) {
                    socket.disconnect();
                } else {

                    var userID;
                    var mod = 0;
                    var roomHistory;
                    var userReports;

                    try {
                        await database.getUserID(username).then(meta => { 
                            userID = meta; 
                        });
                    } catch (e) {
                        console.log("Database could not find userID.");
                        console.log("Catch error: " + e);
                    }

                    try {
                        await database.getUserRole(userID).then(meta => { 
                            if (meta != 4) {
                                mod = 1;
                            }
                        });
                    } catch (e) {
                        console.log("Database could not find moderator status.");
                        console.log("Catch error: " + e);
                    }

                    // Add the new user to the array of connected users
                    const user = userJoin(socket.id, userID, username, roomName, mod);

                    // Connect the user to their respective room
                    socket.join(user.room);

                    // Welcome message
                    // Broadcast user join
                    timestamp = momentTZ().tz("America/New_York").format('llll');
                    var msg;

                    if (user.mod === 1) {
                        msg = '<span style="color:var(--bs-yellow);"><i class="bi bi-star-fill"></i> ' + user.username + '</span> has joined the chat at ' + timestamp;
                    } else {
                        msg = '<span style="color:var(--bs-yellow);">' + user.username + '</span> has joined the chat: ' + timestamp;
                    }

                    io.to(user.room).emit(
                        'server message',
                        msg
                    );

                    // Update the current user's room list so that the list shows they are connected
                    const roomUsers = getRoomUsers(user.room);
                    try {
                        await io.to(user.room).emit('update users', roomUsers);
                    } catch (e) {
                        console.log("Update users: " + e);
                    }

                    try {
                        // Populate the user's message history with the 100 most recent messages
                        await database.get100messages(roomName).then(meta => {
                            roomHistory = meta;

                            if (roomHistory.length > 0) {
                                // Format all of the timestamps into a readable format
                                roomHistory.forEach(element => {
                                    var newStamp = momentTZ(element.timestamp).tz("America/New_York").format('llll');
                                    element.timestamp = newStamp;
                                });
                            }
                        });
                    } catch (e) {
                        console.log("100 Message History: " + e);
                    }

                    try {
                        await database.getAllReportedMessages(user.id).then(meta => {
                            userReports = meta;
                        });
                    } catch (e) {
                        console.log("Reported Messages: " + e);
                    }

                    io.to(socket.id).emit('room history', roomHistory, userReports);
                }
            });
        } catch (e) {
            console.log("Connection error: " + e); 
        }

        // Listen for sockets sending 'chat message'
        socket.on('chat message', async (msg) => {

            // I need to clean the message here
            msg = msg.replace("<script>", "");
            msg = msg.replace("</script>", "");

            // Get the user that sent the message
            let theuser = new Promise ((resolve, reject) => {
                resolve(getCurrentUser(socket.id));
            });
            theuser.then(async (user) => {

                // Create a timestamp to send to database and to display in chat
                timestampSQL = momentTZ().tz("America/New_York").format('YYYY-MM-DD HH:mm:ss');
                timestamp = momentTZ().tz("America/New_York").format('llll');

                // TENSORFLOW.JS PLACEHOLDER
    
                // Determine if anything immproper is being said
                // const toxic_array = await toxicity.classify(msg);
                // const toxic_array = 0;
    
                // Replace msg if toxic
                // if (toxic_array.length > 0) {
                //     // Give the user their message back in their input field to edit
                //     io.to(user.socket).emit('return message', msg);
    
                //     // Create a warning message and send it as a server message
                //     msg = `<span style="color:var(--yellow);"><i class='fas fa-exclamation-triangle'></i>   INAPPROPRIATE MESSAGE   <i class='fas fa-exclamation-triangle'></i><br>Please edit and resubmit.</span>`;
                //     io.to(user.room).emit('server message', msg);
                // } else {

                    var sqlMsg = msg;
                    
                    // I need to clean the message here
                    sqlMsg = sqlMsg.replace("\\", "\\\\");
                    sqlMsg = sqlMsg.replace("\'", "\\'");

                    // Save message to database
                    await database.addLiveChatMessage(user.id, user.room, timestampSQL, sqlMsg).catch(function(reject){console.log(reject);});
    
                    // Get newly created messageID from database for div ID value
                    var msgID = await database.getMessageID(user.id, timestampSQL, msg).catch(function(reject){console.log(reject);});
                    
                    // Send the message to the user's respective room
                    io.to(user.room).emit('chat message', msg, user.username, user.mod, timestamp, msgID);
                // }
            });
        });

        // Listen for sockets sending 'delete message'
        socket.on('delete message', async (msgID) => {
            // Get the user that sent the message
            const user = getCurrentUser(socket.id);
            
            // Delete message from database
            await database.deleteMessage(msgID);
            io.to(user.room).emit('remove message', msgID);
        });

        // Listen for sockets sending 'hide message'
        socket.on('hide message', async (msgID) => {
            // Get the user that sent the message
            const user = getCurrentUser(socket.id);
            
            // Update message in database to be hidden
            await database.hideMessage(msgID);

            // Get message from DB to broadcast to room
            var msg;
            await database.get1message(msgID).then(meta => {
                msg = meta;

                // Show message to all users in room
                io.to(user.room).emit('hide message', msg);
            });
        });

        // Listen for sockets sending 'hide message'
        socket.on('unhide message', async (msgID) => {
            // Get the user that sent the message
            const user = getCurrentUser(socket.id);
            
            // Update message in database to be visible
            await database.unhideMessage(msgID);

            // Get message from DB to broadcast to room
            var msg;
            await database.get1message(msgID).then(meta => {
                msg = meta;

                msg.forEach(element => {
                    var newStamp = momentTZ(element.timestamp).tz("America/New_York").format('llll');
                    element.timestamp = newStamp;
                });

                // Show message to all users in room
                io.to(user.room).emit('show message', msg);
            });
        });

        socket.on('report message', async (msgID, reason) => {
            // Get the user that sent the message
            try {
                const user = getCurrentUser(socket.id);

                await database.reportMessage(msgID, user.id, reason);
                io.to(socket.id).emit('report message', msgID);
            } catch (err){
                console.log(err)
            }
        });

        // When a user leaves a page using Socket.io, terminate the socket.
        socket.on('disconnect', () => {

            // Remove user from the current list of active users
            const user = userLeave(socket.id);

            if (user) {
                // Send a message to the chat stating that they have left
                timestamp = momentTZ().tz("America/New_York").format('llll');
                var msg;

                if (user.mod === 1) {
                    msg = '<span style="color:var(--bs-yellow);"><i class="bi bi-star-fill"></i> ' + user.username + '</span> has left the chat at ' + timestamp;
                } else {
                    msg = '<span style="color:var(--bs-yellow);">' + user.username + '</span> has left the chat at ' + timestamp;
                }

                io.to(user.room).emit(
                    'server message',
                    msg
                );

                // Update the current user's room list so that the list shows they have left
                const roomUsers = getRoomUsers(user.room);
                io.to(user.room).emit('update users', roomUsers);
            }
        })
    });
}