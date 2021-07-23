
/**
 * This module is used to make queries and operations against the User Database.
 * In a test configuration, a different database container is used, therefore any modifications
 * or deletions during testing will not affect the main database.
 */

/** @module userDB*/

var userdb = require('./liveChatDB');

module.exports = {
    nameInDB,
    // return statement
    getUser,
    getUserID,
    getName,
    getChatRoom,
    getUserChatRoom,
    getAllChatRooms,
    getUserRole,
    getLastLogin,
    getAllReports,
    getReport,
    // update statement
    setChatRoom,
    setLastLogin,
    setUserRole,
    setPwd,
    // insert/delete
    addUser,
    removeChatRoomUser,
    // Live chat functions
    addLiveChatMessage,
    getMessageID,
    hideMessage,
    unhideMessage,
    reportMessage,
    deleteMessage,
    get1message,
    get100messages,
    isReportedMessage,
    getAllReportedMessages,
    resolveMessage,
    updateReason,
    setMessasgeWarn
};

/**
 * Returns a promise resolved of T/F if the given name is in the DB
 * @param {string} username
 * @param {*} resolve
 * @param {*} reject
 */
 function nameInDB (username) {
    return new Promise((resolve,reject) => {
        var sql = 'SELECT userID FROM user WHERE username = ?';
        userdb.query(sql, [username], function(error, result) {
            if (error) {  // If an error in query is encountered
                reject('nameInDB: ' + error);
            }
            else  {
                if (result.length > 0) {
                    // console.log('result in ID',result[0]);
                    resolve(1);
                }
                resolve(0);
            }
        });
    })
}

/**
 * Gets all information about the user using SELECT *.
 * Input can be either username or email.
 * @param {string} input use either userID or username
 * @return Resolves all data from the user.
 */
function getUser (input) {
    //console.log(input);
    return new Promise((resolve,reject) => {
        const sql = (typeof(input) == 'number') ?
            `SELECT u.*, 
                    r.title 
             FROM user AS u, 
                  user_role AS ur, 
                  roles AS r 
             WHERE u.userID = ur.userID AND 
                   ur.roleID = r.roleID AND 
                   u.userID = ${input}` :
            `SELECT u.*, 
                    r.title 
             FROM user AS u, 
                  user_role AS ur, 
                  roles AS r 
             WHERE u.userID = ur.userID AND 
                   ur.roleID = r.roleID AND 
                   u.username = "${input}"`;
        userdb.query(sql, [input,input], function(error, result) {
            if (error) {  // If an error in query is encountered
                reject('getUser: ' + error);
            }
            else  {
                if (result.length > 0) {
                    resolve(result);
                }
                reject('getUser: Could not find user' + input);
            }
        });
    })
}

/**
 * Returns a promise resolved to userID of the given  username
 * @param {string} input must accept username
 * @param {*} resolve
 * @param {*} reject
 */
function getUserID (input) {
    return new Promise((resolve,reject) => {
        var sql = `SELECT userID 
                   FROM user 
                   WHERE username = ?`;
        userdb.query(sql, [input], function(error, result) {
            if (error) {  // If an error in query is encountered
                reject('getUserID: ' + error);
            }
            else  {
                if (result.length > 0) {
                    resolve(result[0].userID);
                }
                reject('getUserID: Could not find userID: ' + input)
            }
        });
    })
}

/**
 * Returns the name of the given userID
 * @param {string} userID
 * @param {*} resolve
 * @param {*} reject
 */
function getName (userID) {
    return new Promise((resolve,reject) => {
        var sql = `SELECT username 
                   FROM user 
                   WHERE userID = ?`;
        userdb.query(sql, [userID], function(error, result) {
            if (error) {  // If an error in query is encountered
                reject('getName: ' + error);
            }
            else  {
                if (result.length > 0) {
                    // console.log('result ',result[0]);
                    resolve(result[0].username);
                }
                reject('getName: Could not find user');
            }
        });
    })
}

/**
 * Update the password, returns the number of affected rows
 * @param {string} userID
 * @param {string} pwd
 * @param {*} resolve
 * @param {*} reject
 */
function setPwd (userID, pwd) {
    return new Promise((resolve,reject) => {
        var sql = `UPDATE user 
                   SET password = ? 
                   WHERE userID = ?`;
        userdb.query(sql, [pwd, userID], function(error, result) {
            if (error) {  // If an error in query is encountered
                reject('setPwd: ' + error);
            }
            else  {
                resolve(result.affectedRows);
            }
        });
    })
}

/**
 * Gets all information about the user using SELECT *.
 * Input can be either username or email.
 * @param {string} input 
 * @param {*} callback 
 */
function addUser(username, pwd) {
    return new Promise((resolve,reject) => {
        var sql = `INSERT INTO user (username, password) 
                   VALUES (?,?)`;
        userdb.query(sql, [username,pwd], function(error, result) {
            if (error) {  // If an error in query is encountered
                reject('addUser: ' + error);
            }
            else  {
                resolve(result.insertId);
            }
        });
    })
}

/**
 * Makes a user a moderator.  Does not assign the user to be a moderator of a group, just makes them available.
 * 
 * @param {int} userID
 * @param {boolean} value Truthy value if moderator, else is not a moderator
 * @return Resolves affected row, should be 1 for correct operation.
 */
function setUserRole (userID, roleID) {
    return new Promise((resolve,reject) => {
        var sql = `INSERT INTO user_role (userID, roleID) 
                   VALUES (?,?)`;
        userdb.query(sql, [userID, roleID], function(error, result) {
            if (error) {  // If an error in query is encountered
                reject('setUserRole: ' + error);
            }
            else  {
                resolve(result.affectedRows);
            }
        });
    })
}

/**
 * Gets all information about the user using SELECT *.
 * Input can be either username or email.
 * @param {string} input 
 * @param {*} callback 
 */
function getUserRole (userID) {
    //console.log(userID);
    return new Promise((resolve,reject) => {
        var sql = `SELECT roleID 
                   FROM user_role 
                   WHERE userID = ?`;
        userdb.query(sql, [userID], function(error, result) {
            if (error) {  // If an error in query is encountered
                reject('getUserRole: ' + error);
            }
            else  {
                if (result.length > 0) {
                    resolve(result[0].roleID);
                }
                reject('getUserRole: Could not find user');
            }
        });
    })
}

/**
 * Inserts new row to assign a chat room to a user.
 * Input must be userID and roomID.
 * 
 * @param {int} userID 
 * @param {int} roomID 
 * @param {*} callback 
 */
function setChatRoom (userID, roomID) {
    return new Promise((resolve,reject) => {
        var sql = `INSERT INTO room_assignment (userID, roomID) 
                   VALUES (?,?)`;
        userdb.query(sql, [userID,roomID], function(error, result) {
            if (error) {  // If an error in query is encountered
                reject('setChatRoom: ' + error);
            }
            else  {
                resolve(result.affectedRows);
            }
        });
    })
}

/**
 * Inserts new row to assign a chat room to a user.
 * Input must be userID and roomID.
 * @param {int} userID 
 * @param {*} callback 
 */
 function getChatRoom(roomID) {
    return new Promise((resolve,reject) => {
        var sql = `SELECT *
                   FROM live_chat_rooms
                   WHERE roomID = ?`;
        userdb.query(sql, [roomID], function(error, result) {
            if (error) {  // If an error in query is encountered
                reject('getChatRoom: ' + error);
            }
            else  {
                if (result.length > 0) {
                    resolve(result);
                }
                reject('getChatRoom: Could not find user');
            }
        });
    });
}

/**
 * Inserts new row to assign a chat room to a user.
 * Input must be userID and roomID.
 * @param {int} userID 
 * @param {*} callback 
 */
function getUserChatRoom (userID) {
    // console.log(userID);
    return new Promise((resolve,reject) => {
        var sql = `SELECT lcr.*
                   FROM live_chat_rooms as lcr,
                        room_assignment as ra
                   WHERE lcr.roomID = ra.roomID AND 
                         userID = ?`;
        userdb.query(sql, [userID], function(error, result) {
            if (error) {  // If an error in query is encountered
                reject('getUserChatRoom: ' + error);
            }
            else  {
                if (result.length > 0) {
                    resolve(result);
                }
                reject('getUserChatRoom: Could not find user');
            }
        });
    });
}

/**
 * Inserts new row to assign a chat room to a user.
 * Input must be userID and roomID.
 * @param {int} userID 
 * @param {*} callback 
 */
 function getAllChatRooms() {
    return new Promise((resolve,reject) => {
        var sql = `SELECT * 
                   FROM live_chat_rooms`;
        userdb.query(sql, function(error, result) {
            if (error) {  // If an error in query is encountered
                reject('getAllChatRooms: ' + error);
            }
            else  {
                if (result.length > 0) {
                    resolve(result);
                }
                reject('getAllChatRooms: No rooms could be found.');
            }
        });
    });
}

/**
 * Removes the chat room assignment to a user.
 * @param {int} userID 
 * @param {int} roomID 
 * @returns affectedRows, should be 1
 */
function removeChatRoomUser (userID, roomID) {
    return new Promise (async (resolve, reject) => {
        const sql = `DELETE 
                     FROM room_assignment 
                     WHERE userID = ${userID} AND 
                           roomID = ${roomID}`;
        userdb.query(sql, (err, res) => {
            if (err) {
                reject('removeChatRoomUser: ' + err);
            } else {
                resolve(res.affectedRows);
            }
        });
    });
}

/**
 * Gets all information about the user using SELECT *.
 * Input can be either username or email.
 * @param {string} userID 
 * @param {*} callback 
 */
function setLastLogin (userID, date) {
    return new Promise((resolve,reject) => {
        var sql = `UPDATE user 
                   SET lastLogin = ? 
                   WHERE userID = ?`;
        userdb.query(sql, [date,userID], function(error, result) {
            if (error) {  // If an error in query is encountered
                reject('setLastLogin: ' + error);
            }
            else  {
                resolve(result.affectedRows);
            }
        });
    });
}

/**
 * Gets all information about the user using SELECT *.
 * Input can be either username or email.
 * @param {string} userID 
 * @param {*} callback 
 */
function getLastLogin (userID) {
    //console.log(userID);
    return new Promise((resolve,reject) => {
        var sql = `SELECT lastLogin 
                   FROM user 
                   WHERE userID = ?`;
        userdb.query(sql, [userID], function(error, result) {
            if (error) {  // If an error in query is encountered
                reject('getLastLogin: ' + error);
            }
            else  {
                if (result.length > 0) {
                    resolve(result[0].lastLogin);
                }
                reject('Could not find user');
            }
        });
    });
}

/**
 * Stores live chat message.
 * @param {int} userID 
 * @param {int} roomID
 * @param {datetime} timestamp
 * @param {string} msg
 */
 function addLiveChatMessage(userID, roomID, timestamp, msg) {
    return new Promise((resolve,reject) => {
        
        var sql = `INSERT INTO live_chat_messages 
                   VALUES (NULL, ${userID}, ${roomID}, '${timestamp}', 1, '${msg}')`;
        userdb.query(sql, function(error, result) {
            if (error) {  // If an error in query is encountered
                reject('addLiveChatMessage: ' + error);
            }
            else {
                resolve(result.insertId);
            }
        });
    });
}

/**
 * Returns the messageID with the corresponding information.
 * Input must be userID, timestamp, and message.
 * @param {int} userID
 * @param {datetime} timestamp
 * @param {string} message
 * @return {int} messageID
 */
 function getMessageID (userID, timestamp, message) {
    return new Promise((resolve,reject) => {
        // I need to clean the message here
        message = message.replace("\'", "\\'");

        var sql = `SELECT messageID 
                   FROM live_chat_messages 
                   WHERE userID = ${userID} AND 
                         timestamp = '${timestamp}' AND 
                         message = '${message}' 
                   LIMIT 1`;
        userdb.query(sql, function(error, result) {
            if (error) {  // If an error in query is encountered
                reject('getMessageID: ' + error);
            }
            else  {
                if (result.length > 0) {
                    resolve(result[0].messageID);
                } else {
                    resolve(0);
                }
            }
        });
    })
}

/**
 * Hides a message.
 * Input must be messageID.
 * @param {int} messageID 
 * @param {*} callback 
 */
 function hideMessage(messageID) {
    return new Promise((resolve,reject) => {
        var sql = `UPDATE live_chat_messages 
                   SET visible = 0 
                   WHERE messageID = ?`;
        userdb.query(sql, [messageID], function(error, result) {
            if (error) {  // If an error in query is encountered
                reject('hideMessage: ' + error);
            }
            else {
                resolve(result.insertId);
            }
        });
    });
}

/**
 * Unhides a message.
 * Input must be messageID.
 * @param {int} messageID 
 * @param {*} callback 
 */
 function unhideMessage(messageID) {
    return new Promise((resolve,reject) => {
        var sql = `UPDATE live_chat_messages 
                   SET visible = 1 
                   WHERE messageID = ?`;
        userdb.query(sql, [messageID], function(error, result) {
            if (error) {  // If an error in query is encountered
                reject('unhideMessage: ' + error);
            }
            else {
                resolve(result.insertId);
            }
        });
    });
}

/**
 * Reports a message.
 * Input must be messageID, userID, and a reason.
 * @param {int} messageID 
 * @param {int} userID
 * @param {string} reason
 * @param {*} callback 
 */
 function reportMessage(messageID, userID, reason) {
    return new Promise((resolve,reject) => {
        // The zero value is the 'resolved' column which should be false on any new report
        var sql = `INSERT INTO live_chat_reports 
                   VALUES (${messageID}, ${userID}, '${reason}', 0, 0)`;
        userdb.query(sql, function(error, result) {
            if (error) {  // If an error in query is encountered
                reject('reportMessage: ' + error);
            }
            else {
                resolve(result.affectedRows);
            }
        });
    });
}

/**
 * Deletes a message.
 * Input must be messageID.
 * @param {int} messageID 
 * @param {*} callback 
 */
 function deleteMessage(messageID) {
    return new Promise((resolve,reject) => {
        var sql = `DELETE FROM live_chat_messages 
                   WHERE messageID = ?`;

        userdb.query(sql, [messageID], function(error, result) {
            if (error) {  // If an error in query is encountered
                reject('deleteMessage: ' + error);
            }
            else  {
                resolve(result.affectedRows);
            }
        });
    });
}

/**
 * Returns a single message with the corresponding messageID.
 * Input must be messageID.
 * @param {int} msgID
 * @returns username, moderator status, messageID, userID, roomID, timestamp, visibility, and message.
 */
 function get1message (msgID) {
    return new Promise((resolve,reject) => {
        var sql = `SELECT u.username, 
                          r.title, 
                          lcm.* 
                   FROM user AS u, 
                        user_role AS ur, 
                        roles AS r, 
                        live_chat_messages AS lcm 
                   WHERE u.userID = ur.userID AND 
                         ur.roleID = r.roleID AND 
                         u.userID = lcm.userID AND 
                         lcm.messageID = ${msgID}`;
        userdb.query(sql, function(error, result) {
            if (error) {  // If an error in query is encountered
                reject('get1message: ' + error);
            }
            else  {
                if (result.length > 0) {
                    resolve(result);
                } else {
                    resolve(0);
                }
            }
        });
    })
}

/**
 * Returns the most recent 100 messages with the corresponding roomID.
 * Input must be roomID.
 * @param {int} roomID
 * @returns username, moderator status, messageID, userID, roomID, timestamp, visibility, and message.
 */
 function get100messages (roomID) {
    return new Promise((resolve,reject) => {
        var sql = `SELECT u.username, r.title, lcm.* 
                   FROM user AS u, 
                       user_role AS ur, 
                       roles AS r, 
                       live_chat_messages AS lcm 
                   WHERE u.userID = ur.userID AND 
                       ur.roleID = r.roleID AND 
                       u.userID = lcm.userID AND 
                       lcm.roomID = ${roomID} 
                   ORDER BY lcm.timestamp DESC 
                   LIMIT 100`;
        userdb.query(sql, function(error, result) {
            if (error) {  // If an error in query is encountered
                reject('get100messages: ' + error);
            }
            else  {
                if (result.length > 0) {
                    resolve(result);
                } else {
                    resolve(0);
                }
            }
        });
    })
}

/**
 * Returns one message that a user has reported.
 * Input must be userID.
 * @param {int} userID
 * @param {int} msgID
 * @returns 1 for true, 0 for false
 */
 function isReportedMessage (userID, msgID) {
    return new Promise((resolve,reject) => {
        var sql = `SELECT messageID 
                   FROM live_chat_reports 
                   WHERE userID = ${userID} AND 
                         messageID = ${msgID}`;
        userdb.query(sql, function(error, result) {
            if (error) {  // If an error in query is encountered
                reject('getReportedMessage: ' + error);
            }
            else  {
                if (result.length > 0) {
                    resolve(1);
                } else {
                    resolve(0);
                }
            }
        });
    })
}

/**
 * Returns all of the messages that a user has reported.
 * Input must be userID.
 * @param {int} userID
 * @returns messageID
 */
 function getAllReportedMessages (userID) {
    return new Promise((resolve,reject) => {
        var sql = `SELECT messageID 
                   FROM live_chat_reports 
                   WHERE userID = ${userID}`;
        userdb.query(sql, function(error, result) {
            if (error) {  // If an error in query is encountered
                reject('getAllReportedMessages: ' + error);
            }
            else  {
                if (result.length > 0) {
                    resolve(result);
                } else {
                    resolve(0);
                }
            }
        });
    })
}

/**
 * This function may need to be limited to the moderators group number.  
 * For now it returns all reports.  
 * @returns all reports
 */
function getAllReports() {
    return new Promise ((resolve, reject) => {
       
        const sql = `SELECT reported.messageID AS id, 
                            reportee.resolved AS resolved, 
                            reported.message AS message, 
                            A.username AS reported, 
                            B.username AS reportee 
                     FROM live_chat_messages AS reported, 
                          live_chat_reports AS reportee, 
                          user AS A, 
                          user AS B
                     WHERE reported.messageID = reportee.messageID AND 
                           reported.userID = A.userID AND 
                           reportee.userID = B.userID`;
        userdb.query(sql, (error, result) => {
            if (error) {  // If an error in query is encountered
                reject('getAllReports: ' + error);
            }
            else  {
                resolve(result);
            }
        })
    });
}

/**
 * This function may need to be limited to the moderators group number.  
 * For now it returns all reports.  
 * @param {int} id the messageID
 * @returns all reports
 */
function getReport(id) {
    return new Promise ((resolve, reject) => {
       
        const sql = `SELECT reported.messageID AS id, 
                            reported.message AS message, 
                            reportee.resolved AS resolved, 
                            reportee.reason, 
                            reportee.warning
                     FROM live_chat_messages AS reported, 
                          live_chat_reports AS reportee
                     WHERE reported.userID = ${id} AND 
                           reported.messageID = reportee.messageID`;
        userdb.query(sql, (error, result) => {
            if (error) {  // If an error in query is encountered
                reject('getReport: ' + error);
            }
            else  {
                resolve(result);
            }
        })
    });
}

/**
 * Sets a reported message to resolved.
 * @param {int} messageID the message ID
 * @returns affected rows if successful
 */
function resolveMessage(messageID) {
    return new Promise ((resolve, reject) => {
       
        const sql = `UPDATE live_chat_reports 
                     SET resolved = true 
                     WHERE messageID = ${messageID}`;
        userdb.query(sql, (error, result) => {
            if (error) {  // If an error in query is encountered
                reject('resolveMessage: ' + error);
            }
            else  {
                if (result.affectedRows > 0) {
                    resolve(result.affectedRows);
                }
                else {
                    reject('could not resolve message');
                }
            }
        })
    });
}

/**
 * Adds a comment to a reported message describing the reasoning for the action taken.
 * @param {int} messageID the messageID
 * @param {string} reason a comment 
 * @returns affected rows if successful
 */
function updateReason(messageID,reason) {
    return new Promise ((resolve, reject) => {
       
        const sql = `UPDATE live_chat_reports 
                     SET reason = '${reason}' 
                     WHERE messageID = ${messageID}`;
        userdb.query(sql, (error, result) => {
            if (error) {  // If an error in query is encountered
                reject('resolveMessage: ' + error);
            }
            else  {
                if (result.affectedRows > 0) {
                    resolve(result.affectedRows);
                }
                else {
                    reject('could not resolve message reason');
                }
            }
        })
    });
}

/**
 * If a message was removed for inappropriate content, set the message to warn, allowing the reported user to see their deleted comment.
 * @param {int} messageID the messageID
 * @param {boolean} value set to true or false
 * @returns affected rows if successful
 */
function setMessasgeWarn(messageID,value) {
    return new Promise ((resolve, reject) => {
       
        const sql = `UPDATE live_chat_reports 
                     SET warn = ${value} 
                     WHERE messageID = ${messageID}`;
        userdb.query(sql, (error, result) => {
            if (error) {  // If an error in query is encountered
                reject('resolveMessage: ' + error);
            }
            else  {
                if (result.affectedRows > 0) {
                    resolve(result.affectedRows);
                }
                else {
                    reject('could not resolve message warning');
                }
            }
        })
    });
}