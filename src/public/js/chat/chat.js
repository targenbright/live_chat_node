const chatForm = document.getElementById('chatForm');
const chatInput = document.getElementById('chatInput');
const chatMessages = document.querySelector('.chat-messages');
const reportModal = document.getElementById('reportModal');
var myModerator;
const modList = document.getElementById('moderators');
const userList = document.getElementById('users');
var showUsers = 1;

// Create a socket for the user
var socket = io();

// Join user to their specific room
socket.emit('user join', myUsername, myRoomName);

// Actions when a message is submit in the input box
chatForm.addEventListener('submit', function(e) {
  // Prevent form actions from happening
  e.preventDefault();

  // If the chat input has content...
  if (chatInput.value) {
    var msg = chatInput.value;

    // I need to clean the message here
    msg = msg.replace("<script>", "");
    msg = msg.replace("</script>", "");

    // emit over the current socket the input value.
    socket.emit('chat message', msg);

    // Erase the message that was just submit.
    chatInput.value = '';
  }
});

// Sends the messageID to the reportModal when reporting a message
reportModal.addEventListener('show.bs.modal', function (event) {
  var button = event.relatedTarget;

  var messageID = button.getAttribute('data-bs-message-id');

  var submit = document.getElementById('report-button');
  submit.addEventListener('click', function () {
    var reason = document.getElementById('report-reason').value;
    // console.log(messageID + ": " + reason);
    reportMessage(messageID, reason);
  });
});

// Get the chat history
socket.on('room history', function(history, reports) {
  // Display all history
  if (history.length > 0) {
    history.forEach((message) => {
      
      // Check that the message has not been marked to be hidden by a moderator
      if (message.visible === 1) { 

        const messageRow = document.createElement('div');
        messageRow.setAttribute('id', 'messageID_' + message.messageID);

        // Create a message container
        const div = document.createElement('div');
        div.setAttribute('id', 'msgID_' + message.messageID);

        // Create a text container for the username
        const p = document.createElement('p');
        p.setAttribute('id', 'user_' + message.messageID);

        // Create a text container for the message contents
        const para = document.createElement('p');
        para.setAttribute('id', 'para_' + message.messageID);
        
        para.innerText = message.message;

        // Create a text container for the timestamp
        const stamp = document.createElement('p');
        stamp.setAttribute('id', 'stamp_' + message.messageID);
        stamp.innerText = message.timestamp;

        // If they are a moderator, put a star by their name and delete buttons on all messages
        if (message.title != 'User') {
          p.innerHTML = '<i class="fas fa-star"></i> ' + message.username;
        } else {
          p.innerText = message.username;
        }

        // Create a container for message actions
        const actions = document.createElement('div');
        const reportMsg = document.createElement('span');
        reportMsg.setAttribute('id', 'report_' + message.messageID);
        var reportFound = 0;
        if (reports.length > 0) {

          reports.forEach((report) => {
            if (report.messageID == message.messageID) {
              reportMsg.innerHTML = "<a class='badge bg-danger me-3 p-1 pe-3 ps-3'><i class='fas fa-exclamation-triangle'></i> REPORTED</a>"
              reportFound = 1;
              return;
            }
          });

          if (reportFound == 0) {
            reportMsg.innerHTML = "<a class='badge bg-warning me-3 p-1 pe-3 ps-3' data-bs-toggle='modal' data-bs-target='#reportModal' data-bs-message-id='" + message.messageID + "'><i class='fas fa-exclamation-triangle'></i> REPORT</a>"
          }
        } else {
          reportMsg.innerHTML = "<a class='badge bg-warning me-3 p-1 pe-3 ps-3' data-bs-toggle='modal' data-bs-target='#reportModal' data-bs-message-id='" + message.messageID + "'><i class='fas fa-exclamation-triangle'></i> REPORT</a>"
        }
        
        const deleteMsg = document.createElement('span');
        deleteMsg.innerHTML = "<a class='badge bg-warning ms-3 p-1 pe-3 ps-3'><i class='fas fa-trash'></i> DELETE</a>"
        deleteMsg.addEventListener('click', event => {
          deleteMessage(message.messageID);
        });
        const hideMsg = document.createElement('span');
        hideMsg.setAttribute('id', 'hide_' + message.messageID);
        hideMsg.innerHTML = "<a class='badge bg-warning me-3 p-1 pe-3 ps-3'><i class='far fa-eye'></i> HIDE</a>"
        hideMsg.addEventListener('click', event => {
          hideMessage(message.messageID);
        });

        // Create extra div to fill the blank column
        const extra = document.createElement('div');

        // Format the message container based on if the user is viewing their own message or another user's
        if (message.username === myUsername) {
          messageRow.classList.add('my-message-spacing');
          div.classList.add('myMessage');
          p.classList.add('myMeta');
          para.classList.add('myMessageText');
          stamp.classList.add('myTimestamp');
          actions.classList.add('myActions');
          actions.appendChild(deleteMsg);

          // Append all information to the message container
          messageRow.appendChild(extra);
          messageRow.appendChild(div);
          div.appendChild(p);
          div.appendChild(para);
          div.appendChild(stamp);
          div.appendChild(actions);
        } else {
          
          if (myModerator === 1) {
            actions.appendChild(reportMsg);
            actions.appendChild(hideMsg);
          } else {
            actions.appendChild(reportMsg);
          }
          messageRow.classList.add('message-spacing');
          div.classList.add('message');
          p.classList.add('meta');
          para.classList.add('messageText');
          stamp.classList.add('timestamp');
          actions.classList.add('actions');

          // Append all information to the message container
          messageRow.appendChild(div);
          div.appendChild(p);
          div.appendChild(para);
          div.appendChild(stamp);
          div.appendChild(actions);
          messageRow.appendChild(extra);
        }
        
        // Append the message to the message window
        document.querySelector('.chat-messages').prepend(messageRow);

        // Force the message window to the bottom when a new message is submit
        chatMessages.scrollTop = chatMessages.scrollHeight;
      }
    });
  }
});

// Update the user list
socket.on('update users', function(users) {
  // Clear the list so it can update without duplicates
  modList.innerHTML = '';
  userList.innerHTML = '';

  // For every connected user in the room
  users.forEach((user) => {

    // Create a username div
    const myUserDiv = document.createElement('div');
    const userP = document.createElement('p');
    userP.innerText = user.username;
    myUserDiv.appendChild(userP);

    // Assign them appropriately to moderators or users
    if (user.mod === 1) {
      myUserDiv.classList.add('myUsernameModBlock');
      userP.classList.add('myUsernameModText');
      modList.appendChild(myUserDiv);
    } else {
      myUserDiv.classList.add('myUsernameMemberBlock');
      userP.classList.add('myUsernameMemberText');
      userList.appendChild(myUserDiv);
    }

    // Set client side variable for moderator status
    if (user.username === myUsername) {
      myModerator = user.mod;
    }
  });
});

// Update the messages field when a new message arrives
socket.on('chat message', function(msg, username, mod, timestamp, msgID) {

  // Create row container
  const messageRow = document.createElement('div');
  messageRow.setAttribute('id', 'messageID_' + msgID);

  // Create a message container
  const div = document.createElement('div');
  div.setAttribute('id', 'msgID_' + msgID);

  // Create a text container for the username
  const p = document.createElement('p');
  p.setAttribute('id', 'user_' + msgID);

  // If they are a moderator, put a star by their name
  if (mod === 1) {
    p.innerHTML = '<i class="fas fa-star"></i> ' + username;
  } else {
    p.innerText = username;
  }

  // Create a text container for the message contents
  const para = document.createElement('p');
  para.setAttribute('id', 'para_' + msgID);
  para.classList.add('text');
  para.innerText = msg;

  // Create a text container for the timestamp
  const stamp = document.createElement('p');
  stamp.setAttribute('id', 'stamp_' + msgID);
  stamp.innerText = timestamp;

  // Create a container for message actions
  const actions = document.createElement('div');
  const reportMsg = document.createElement('span');
  reportMsg.setAttribute('id', 'report_' + msgID);
  reportMsg.innerHTML = "<a class='badge bg-warning me-3 p-1 pe-3 ps-3' data-bs-toggle='modal' data-bs-target='#reportModal' data-bs-message-id='" + msgID + "'><i class='fas fa-exclamation-triangle'></i> REPORT</a>"
  const deleteMsg = document.createElement('span');
  deleteMsg.innerHTML = "<a class='badge bg-warning ms-3 p-1 pe-3 ps-3'><i class='fas fa-trash'></i> DELETE</a>"
  deleteMsg.addEventListener('click', event => {
    deleteMessage(msgID);
  });
  const hideMsg = document.createElement('span');
  hideMsg.setAttribute('id', 'hide_' + msgID);
  hideMsg.innerHTML = "<a class='badge bg-warning me-3 p-1 pe-3 ps-3'><i class='fas fa-eye'></i> HIDE</a>"
  hideMsg.addEventListener('click', event => {
    hideMessage(msgID);
  });

  // Create extra div to fill the blank column
  const extra = document.createElement('div');

  // Format the message container based on if the user is viewing their own message or another user's
  if (username === myUsername) {
    messageRow.classList.add('my-message-spacing');
    div.classList.add('myMessage');
    p.classList.add('myMeta');
    para.classList.add('myMessageText');
    stamp.classList.add('myTimestamp');
    actions.classList.add('myActions');
    actions.appendChild(deleteMsg);

    // Append all information to the message container
    messageRow.appendChild(extra);
    messageRow.appendChild(div);
    div.appendChild(p);
    div.appendChild(para);
    div.appendChild(stamp);
    div.appendChild(actions);
  } else {
    if (myModerator === 1) {
      actions.appendChild(reportMsg);
      actions.appendChild(hideMsg);
    } else {
      actions.appendChild(reportMsg);
    }
    messageRow.classList.add('message-spacing')
    div.classList.add('message');
    p.classList.add('meta');
    para.classList.add('messageText');
    stamp.classList.add('timestamp');
    actions.classList.add('actions');

    // Append all information to the message container
    messageRow.appendChild(div);
    div.appendChild(p);
    div.appendChild(para);
    div.appendChild(stamp);
    div.appendChild(actions);
    messageRow.appendChild(extra);
  }
  
  // Append the message to the message window
  document.querySelector('.chat-messages').appendChild(messageRow);

  // Force the message window to the bottom when a new message is submit
  chatMessages.scrollTop = chatMessages.scrollHeight;
});

// Update the message field when the server sends a message
socket.on('server message', function(msg) {

  // Create a message container
  const div = document.createElement('div');
  div.classList.add('serverMessageBlock');

  // Create a text container for the message
  const p = document.createElement('p');
  p.classList.add('serverMessage');
  p.innerHTML = msg;

  // Append message to the message container
  div.appendChild(p);
  
  // Append the message to the message window
  document.querySelector('.chat-messages').appendChild(div);

  // Force the message window to the bottom when a new message is submit
  chatMessages.scrollTop = chatMessages.scrollHeight;
});

// Give the user back the message they just sent.
socket.on('return message', function(msg) {
  // Repopulate the input field with their returned message
  chatInput.value = msg;
});

socket.on('remove message', function(msgID) {
  // Identify the spacing block
  var spacingDiv = document.getElementById('messageID_' + msgID);

  // Remove grid, add block
  spacingDiv.classList.remove('message-spacing');
  spacingDiv.classList.remove('my-message-spacing');
  spacingDiv.classList.add('server-message-spacing');

  // Identify the div containing the message to be deleted
  var messageDiv = document.getElementById('msgID_' + msgID);

  // Identify the parent node holding the message to be deleted
  var parentDiv = messageDiv.parentNode;

  // Create a message container
  const div = document.createElement('div');
  div.classList.add('serverMessageBlock');

  // Create a text container for the message
  const p = document.createElement('p');
  p.classList.add('serverMessage');
  p.innerHTML = '<span style="color:var(--danger);">This message has been removed.</span>';

  // Append message to the message container
  div.appendChild(p);
  
  // Insert delete message before removing it from view
  parentDiv.insertBefore(div, messageDiv);

  // Remove the deleted message from view
  messageDiv.remove();
});

socket.on('hide message', function(msg) {

  msg.forEach((message) => {
    var messageDiv = document.getElementById('msgID_' + message.messageID);

    if (myModerator === 1) {
      // Do not remove message for moderators. Change opacity to 50% to visually represent hidden status
      messageDiv.classList.add('hide-message');

      var hideMsg = document.getElementById('hide_' + message.messageID);

      const unhideMsg = document.createElement('span');
      unhideMsg.setAttribute('id', 'unhide_' + message.messageID);
      unhideMsg.innerHTML = "<a class='badge bg-warning me-3 p-1 pe-3 ps-3'><i class='fas fa-eye-slash'></i> UNHIDE</a>"
      unhideMsg.addEventListener('click', event => {
        unhideMessage(message.messageID);
      });

      var parent = hideMsg.parentNode;

      parent.insertBefore(unhideMsg, hideMsg);
      hideMsg.remove();
    } else {
      messageDiv.innerHTML = "";

      // Create a text container for the message
      const p = document.createElement('p');
      // set class based on user
      if (message.username === myUsername) {
        p.classList.add('myServerMessage');
      } else {
        p.classList.add('othersServerMessage');
      }
      
      p.innerHTML = "This message has been hidden by a moderator.";
      
      // Append the message to the message window
      messageDiv.appendChild(p);
    }
  });
});

socket.on('show message', function(msg) {

  msg.forEach((message) => {
    var messageDiv = document.getElementById('msgID_' + message.messageID);
    

    if (myModerator === 1) {
      // Do not create new message info for moderators. Change opacity to 100% to visually represent hidden status
      messageDiv.classList.remove('hide-message');
  
      var unhideMsg = document.getElementById('unhide_' + message.messageID);
  
      const hideMsg = document.createElement('span');
      hideMsg.setAttribute('id', 'hide_' + message.messageID);
      hideMsg.innerHTML = "<a class='badge bg-warning me-3 p-1 pe-3 ps-3'><i class='fas fa-eye'></i> HIDE</a>"
      hideMsg.addEventListener('click', event => {
        hideMessage(message.messageID);
      });
  
      var parent = unhideMsg.parentNode;
  
      parent.insertBefore(hideMsg, unhideMsg);
      unhideMsg.remove();
    } else {
      // show the message for normal users
      messageDiv.innerHTML = "";

      // Create a text container for the username
      const p = document.createElement('p');
      p.setAttribute('id', 'user_' + message.messageID);

      // Create a text container for the message contents
      const para = document.createElement('p');
      para.setAttribute('id', 'para_' + message.messageID);
      para.innerText = message.message;

      // Create a text container for the timestamp
      const stamp = document.createElement('p');
      stamp.setAttribute('id', 'stamp_' + message.messageID);
      stamp.innerText = message.timestamp;

      // If they are a moderator, put a star by their name and delete buttons on all messages
      if (message.moderator === 1) {
        p.innerHTML = '<i class="fas fa-star"></i> ' + message.username;
      } else {
        p.innerText = message.username;
      }

      // Create a container for message actions
      const actions = document.createElement('div');
      const reportMsg = document.createElement('span');
      reportMsg.setAttribute('id', 'report_' + message.messageID);
      reportMsg.innerHTML = "<a class='badge bg-warning me-3 p-1 pe-3 ps-3' data-bs-toggle='modal' data-bs-target='#reportModal' data-bs-message-id='" + message.messageID + "'><i class='fas fa-exclamation-triangle'></i> REPORT</a>"
      const deleteMsg = document.createElement('span');
      deleteMsg.innerHTML = "<a class='badge bg-warning ms-3 p-1 pe-3 ps-3'><i class='fas fa-trash'></i> DELETE</a>"
      deleteMsg.addEventListener('click', event => {
        deleteMessage(message.messageID);
      });
      const hideMsg = document.createElement('span');
      hideMsg.setAttribute('id', 'hide_' + message.messageID);
      hideMsg.innerHTML = "<a class='badge bg-warning me-3 p-1 pe-3 ps-3'><i class='fas fa-eye'></i> HIDE</a>"
      hideMsg.addEventListener('click', event => {
        hideMessage(message.messageID);
      });

      // Format the message container based on if the user is viewing their own message or another user's
      if (message.username === myUsername) {
        p.classList.add('myMeta');
        para.classList.add('myMessageText');
        stamp.classList.add('myTimestamp');
        actions.classList.add('myActions');
        actions.appendChild(deleteMsg);
      } else {
        
        if (myModerator === 1) {
          actions.appendChild(hideMsg);
        } else {
          actions.appendChild(reportMsg);
        }
        p.classList.add('meta');
        para.classList.add('messageText');
        stamp.classList.add('timestamp');
        actions.classList.add('actions');
      }

      // Append all information to the message container
      messageDiv.appendChild(p);
      messageDiv.appendChild(para);
      messageDiv.appendChild(stamp);
      messageDiv.appendChild(actions);
    }
  });
});

socket.on('report message', function(msgID) {
  // Update the button to show that it was reported
  var reportMsg = document.getElementById('report_' + msgID);

  var parent = reportMsg.parentNode;

  var newReportMsg = document.createElement('span');
  reportMsg.setAttribute('id', 'report_' + msgID);

  newReportMsg.innerHTML = "<a class='badge bg-danger me-3 p-1 pe-3 ps-3'><i class='fas fa-exclamation-triangle'></i> REPORTED</a>"
  // parent.appendChild(newReportMsg);
  parent.insertBefore(newReportMsg, reportMsg);

  reportMsg.remove();
}); 

socket.on('disconnect', function() {
  window.location.href="http://www.timargenbright.com/projects/chat/login";
});

function deleteMessage(msgID) {
  socket.emit('delete message', msgID);
}

function hideMessage(msgID) {
  socket.emit('hide message', msgID);
}

function unhideMessage(msgID) {
  socket.emit('unhide message', msgID);
}

function reportMessage(msgID, reason) {
  socket.emit('report message', msgID, reason);
}

function toggleUsers() {
  // Grab the chatMain and chat-sidebar div elements
  var main = document.getElementById("chatMain");
  var sidebar = document.getElementById("chat-sidebar");

  if (showUsers === 0) {
    // Remove temp div for grid layout
    document.getElementById("chat-sidebar-hidden").remove();

    // Edit grid layout to show sidebar
    main.style.gridTemplateColumns = "1fr 3fr";

    // Reset the toggle
    showUsers = 1;
  } else {
    // Edit grid layout to hide sidebar
    main.style.gridTemplateColumns = "0fr 4fr";

    // Create and insert temp div for grid layout
    var tempDiv = document.createElement('div');
    tempDiv.setAttribute('id', 'chat-sidebar-hidden');
    main.insertBefore(tempDiv, sidebar);

    // Reset the toggle
    showUsers = 0;
  }
  
  sidebar.classList.toggle('chat-sidebar-hidden');
  sidebar.classList.toggle('chat-sidebar');
}