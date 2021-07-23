CREATE DATABASE LiveChat;
USE LiveChat;

CREATE TABLE user (
    userID int NOT NULL AUTO_INCREMENT,
    username varchar(64) NOT NULL,
    password varchar(64) NOT NULL,
    lastLogin datetime,
    PRIMARY KEY (userID)
);

CREATE TABLE roles (
    roleID int NOT NULL AUTO_INCREMENT,
    title varchar(200) NOT NULL,
    PRIMARY KEY (roleID)
);

CREATE TABLE user_role (
    userID INT NOT NULL,
    roleID INT NOT NULL,
    PRIMARY KEY (userID, roleID),
    FOREIGN KEY (userID) REFERENCES user (userID) ON DELETE CASCADE,
    FOREIGN KEY (roleID) REFERENCES roles (roleID) ON DELETE CASCADE
);

CREATE TABLE live_chat_rooms (
    roomID int NOT NULL AUTO_INCREMENT,
    roomName varchar(200) NOT NULL,
    PRIMARY KEY (roomID)
);

CREATE TABLE room_assignment (
    userID INT NOT NULL,
    roomID INT NOT NULL,
    PRIMARY KEY (userID, roomID),
    FOREIGN KEY (userID) REFERENCES user (userID) ON DELETE CASCADE,
    FOREIGN KEY (roomID) REFERENCES live_chat_rooms (roomID) ON DELETE CASCADE
);

CREATE TABLE live_chat_messages (
    messageID int NOT NULL AUTO_INCREMENT,
    userID int NOT NULL,
    roomID int NOT NULL,
    timestamp datetime NOT NULL,
    visible boolean NOT NULL,
    message text NOT NULL,
    PRIMARY KEY (messageID),
    FOREIGN KEY (userID) REFERENCES user (userID) ON DELETE CASCADE,
    FOREIGN KEY (roomID) REFERENCES live_chat_rooms (roomID) ON DELETE CASCADE
);

CREATE TABLE live_chat_reports (
    messageID int NOT NULL,
    userID int NOT NULL,
    reason varchar(1000) NULL,
    resolved boolean NOT NULL,
    warning boolean NOT NULL,
    PRIMARY KEY (messageID, userID),
    FOREIGN KEY (messageID) REFERENCES live_chat_messages (messageID) ON DELETE CASCADE,
    FOREIGN KEY (userID) REFERENCES user (userID) ON DELETE CASCADE
);