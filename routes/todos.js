const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const {ensureAuthenticated} = require('../helpers/auth');

// load helper


// load schema
require('../models/Todo');
const Todo = mongoose.model('todos');

// Todo Index Page
router.get('/home', ensureAuthenticated, (req,res) => {
  Todo.find({user: req.user.id}).sort({dueDate:'descending'}).then(todos => {
    res.render('todos/home', {
      todos:todos
    })
  }) // find something in DB
});



// add todo form
router.get('/addlist', ensureAuthenticated, (req,res) => {
  res.render('todos/addlist'); 
});
router.get('/setting', ensureAuthenticated, (req,res) => {
  res.render('todos/setting'); 
});
router.get('/weekly', ensureAuthenticated, (req,res) => {
  res.render('todos/weekly'); 
});
router.get('/profile', ensureAuthenticated, (req,res) => {
  res.render('todos/profile'); 
});

// edit todo form
router.get('/edit/:id', ensureAuthenticated, (req,res) => {
  Todo.findOne({
    _id: req.params.id
  }).then(todo => {
    if (todo.user != req.user.id) {
      req.flash('error_msg', 'Not authorized');
      res.redirect('/todos/home');
    } else {
     res.render('todos/edit', {
       todo: todo
     });
   }; 
  })
});

// process  form
router.post('/addlist', ensureAuthenticated, (req,res) => {
  let errors = [];
  
  if (!req.body.title) {
    errors.push({
      text: 'Please add title'
    })
  }
  if (!req.body.details) {
    errors.push({
      text: 'Please add some details'
    })
  }
  
  if (errors.length > 0) {
    res.render('todos/addlist', {
      errors: errors,
      title: req.body.title,
      details: req.body.details,
      category: req.body.category,
      dueDate: req.body.dueDate,
      time: req.body.time,
      priority: req.body.priority,
      notifyme: req.body.notifyme
    });
  } else {
    const newUser = {
      user: req.user.id,
      title: req.body.title,
      details: req.body.details,
      category: req.body.category,
      dueDate: req.body.dueDate,
      time: req.body.time,
      priority: req.body.priority,
      notifyme: req.body.notifyme
    };
    new Todo(newUser).save().then(todo => {
      req.flash('success_msg', 'Todo added');
      res.redirect('/todos/home');
    })
  }
});

// edit form process
router.put('/:id', ensureAuthenticated, (req,res) => {
  Todo.findOne({
    _id: req.params.id
  }).then(todo => {
    // new values
    todo.title = req.body.title;
    todo.details = req.body.details;
    category=req.body.category;
    dueDate = req.body.duedate;
    time= req.body.time;
    priority= req.body.priority;
    notifyme= req.body.notifyme;
    todo.save().then( todo => {
      req.flash('success_msg', 'Todo updated');
      res.redirect('/todos/home');
    });
  });
});

// delete Todo
router.get('/delete/:id', (req, res) => {
  Todo.findByIdAndRemove(req.params.id, (err, doc) => {
      if (!err) {
          res.redirect('/todos/home');
      }
      else { console.log('Error in employee delete :' + err); }
  });
});



module.exports = router;
