const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required.'],
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required.'],
  },
  mobileNumber: {
    type: String,
    required: [true, 'Mobile number is required.'],
  },
  email: {
    type: String,
    required: [true, 'Email is required.'],
    index: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required.']
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  isSuperAdmin: {
    type: Boolean,
    default: false
  },
  profilepic: {
    type: String,
    default: ""
  },
  resetTokenExpiry: {
    type: Date
  },
  resetToken: {
    type: String
  },
  resetPassword: {
    type: Boolean,
    default: false,
  },
  domainName: {
    type: String,
    default: ""
  },
  role: {
     type: String,
    default: ""
  }
})

UserSchema.pre('save', function (next) {
  if (!this.isModified('password')) {
    // If password field is not being modified, move to the next middleware
    return next();
  }

  if (!this.resetPassword) {
    // If resetPassword flag is not set, hash the password
  } else {
    // If resetPassword flag is set, move to the next middleware without hashing
    next();
  }
});
// const User = mongoose.model(
//   'users',
//   UserSchema
// )

// module.exports = User;

module.exports = UserSchema;
