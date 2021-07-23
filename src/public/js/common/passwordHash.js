var bcrypt = require('bcrypt');
var salt;

async function hash (password) {
    if (!salt) {
        salt = await bcrypt.genSalt(10);
    }
    return await bcrypt.hash(password, salt);
}

module.exports = hash;
