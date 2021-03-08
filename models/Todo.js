const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// create schema
const TodoSchema = new Schema({
  user: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  details: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  dueDate: {
    type: String,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  priority: {
    type: String,
    required: true
  },
  notifyme: {
    type: String,
    required: true
  }

});

mongoose.model('todos', TodoSchema);