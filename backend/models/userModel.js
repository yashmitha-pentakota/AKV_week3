const db = require('../mysql/connection');

module.exports = {
  async createUser(userData) {
    return db('users').insert(userData);
  },
  async findByEmail(email) {
    return db('users').where({ email }).first();
  },
  async findEmail(email) {
  return db('users')
    .select('user_id', 'username', 'email', 'profile_pic') // Include profile photo
    .where({ email })
    .first();
},

  async findByUsername(username) {
    return db('users').where({ username }).first();
  },
  async updateProfilePic(email, url) {
    return db('users').where({ email }).update({ profile_pic: url });
  },
    // Save reset token in the database
   // Save the reset token to the database
async saveResetToken(email, resetToken) {
  return db('users').where({ email }).update({
    reset_token: resetToken,
    reset_token_expiry: Date.now() + 3600000, // 1 hour expiry
  });
},

// Find a user by their reset token
async findByResetToken(resetToken) {
  const user = await db('users').where({ reset_token: resetToken }).first();
  if (user && user.reset_token_expiry > Date.now()) {
    return user; // Token is valid
  }
  return null; // Invalid or expired token
},

// Update the user's password
async updatePassword(email, newPassword) {
  return db('users').where({ email }).update({ password: newPassword });
},
// Clear the reset token after password reset
async clearResetToken(email) {
  return db('users').where({ email }).update({
    reset_token: null,
    reset_token_expiry: null,
  });
},
};