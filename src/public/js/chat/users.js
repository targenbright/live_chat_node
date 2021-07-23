const users = [];

// Join user to chat
function userJoin(socket, id, username, room, mod) {
  const user = { socket, id, username, room, mod };

  users.push(user);

  return user;
}

// Get current user
function getCurrentUser(socket) {
  return users.find(user => user.socket === socket);
}

// User leaves chat
function userLeave(socket) {
  const index = users.findIndex(user => user.socket === socket);

  if (index !== -1) {
    return users.splice(index, 1)[0];
  }
}

// Get room users
function getRoomUsers(room) {
  return users.filter(user => user.room === room);
}

// Get room users
function findUser(finding) {
  return users.filter(user => user.username === finding).length;
}

module.exports = {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers,
  findUser
};