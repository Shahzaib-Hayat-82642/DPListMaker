const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const passport = require('passport');
var async = require('async');
var crypto = require('crypto');
var nodemailer = require('nodemailer');
var LocalStrategy = require('passport-local').Strategy;



// load user model
require('../models/User');
const User = mongoose.model('users');


// user login route
router.get('/login', (req,res) => {
  res.render('users/login');
});

// user login route
router.get('/register', (req,res) => {
  res.render('users/register');
});
router.get('/lost', function(req, res) {
  res.render('users/lost', {
    user: req.user
  });
});
router.get('/reset/:token', function(req, res) {
  User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
    if (!user) {
      req.flash('error', 'Password reset token is invalid or has expired.');
      return res.redirect('/users/lost');
    }
    res.render('users/reset', {
      user: req.user
    });
  });
});



// login form post
router.post('/login', (req,res,next) => {
  passport.authenticate('local', {
    successRedirect: '/todos/home',
    failureRedirect: '/users/login',
    failureFlash: true
  })(req,res,next);
});

// register form post
router.post('/register', (req,res) => {
  let errors = [];
  if (req.body.password != req.body.password2) {
    errors.push({text: 'Passwords do not match!'});
  }
  if (req.body.password.length < 4) {
    errors.push({text: 'Password must be at least 4 characters'}); 
  }
  if (errors.length > 0) {
    res.render('users/register', {
      errors: errors,
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      password2: req.body.password2
    })
  } else {
    User.findOne({
      email: req.body.email
    }).then((user) => {
      if (user) {
        req.flash('error_msg', 'A user with the same email already exists');
        res.redirect('/users/register');
      } else {
        const newUser = new User({
          name: req.body.name,
          email: req.body.email,
          password: req.body.password
        });
        bcrypt.genSalt(10, (err, salt) => {
          bcrypt.hash(newUser.password, salt, (err, hash) => {
            if (err) throw err;
            newUser.password = hash;
            newUser.save().then((user) => {
              req.flash('success_msg', 'You are now registered and can login');
              res.redirect('/users/login');
            }).catch(err => {
              console.log(err);
              return;
            });
          });
        });
      }
    });
  }
})

router.post('/lost', function(req, res, next) {
  async.waterfall([
    function(done) {
      crypto.randomBytes(10, function(err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function(token, done) {
      User.findOne({ email: req.body.email }, function(err, user) {
        if (!user) {
          req.flash('error', 'No account with that email address exists.');
          return res.redirect('/users/lost');
        }

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        user.save(function(err) {
          done(err, token, user);
        });
      });
    },
    function(token, user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
          user: 'email',
          pass: 'Password'
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'SecurityDept@DPListMaker.com',
        subject: 'Node.js Password Reset',
        text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'http://' + req.headers.host + '/users/reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        req.flash('info', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
        done(err, 'done');
      });
    }
  ], function(err) {
    if (err) return next(err);
    res.redirect('/users/lost');
  });
});

router.post('/reset/:token', function(req, res) {
  async.waterfall([
    function(done) {
      User.findOne({ resetPasswordToken: req.body.token }, function(err, user) {
        if (!user) {
          req.flash('error', 'Password reset token is invalid or has expired.');
          return res.redirect('/users/login');
        }

        user.password = req.body.password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        user.save(function(err) {
          req.logIn(user, function(err) {
            done(err, user);
          });
        });
      });
    },
    function(user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
          user: 'email',
          pass: 'password'
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'SecurityDept@DPListMaker.com',
        subject: 'Your password has been changed',
        text: 'Hello,\n\n' +
          'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        req.flash('success', 'Success! Your password has been changed.');
        done(err);
      });
    }
  ], function(err) {
    res.redirect('/users/login');
  });
});



router.get('/logout', (req,res) => {
  req.logout();
  req.flash('success_msg', 'You are logged out');
  res.redirect('/users/login');
});

module.exports = router;
