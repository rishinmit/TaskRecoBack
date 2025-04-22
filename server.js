require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Task Schema
const TaskSchema = new mongoose.Schema({
  date: String,
  time: String,
  task: String,
  datetime: Date, // New field for sorting by datetime
});

const Task = mongoose.model('Task', TaskSchema);

// Save Task Route
app.post('/save-task', async (req, res) => {
  try {
    const { date, time, task } = req.body;
    if (!date || !time || !task) {
      return res.status(400).json({ success: false, message: 'Missing fields' });
    }

    // Convert "24 April 2025" + "09:00 pm" -> Date object
    const datetime = new Date(`${date} ${time}`);

    const newTask = new Task({ date, time, task, datetime });
    await newTask.save();
    res.json({ success: true, message: 'Task saved!', data: newTask });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get Tasks Route (with sorting)
app.get('/get-tasks', async (req, res) => {
  try {
    // Sort tasks by 'datetime' in ascending order (earliest first)
    const tasks = await Task.find().sort({ datetime: 1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tasks' });
  }
});

// Delete Task Route
app.delete('/delete-task/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Received delete request for task ID: ${id}`);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid task ID' });
    }

    const deletedTask = await Task.findByIdAndDelete(id);

    if (!deletedTask) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    res.json({ success: true, message: 'Task deleted successfully', deletedTask });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update Task Route
app.put('/update-task/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { task, date, time } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid task ID' });
    }

    const updatedFields = {};
    if (task) updatedFields.task = task;
    if (date) updatedFields.date = date;
    if (time) updatedFields.time = time;

    // Update the datetime field when date or time is modified
    if (date && time) {
      updatedFields.datetime = new Date(`${date} ${time}`);
    } else {
      const current = await Task.findById(id);
      if (current) {
        if (date) updatedFields.datetime = new Date(`${date} ${current.time}`);
        if (time) updatedFields.datetime = new Date(`${current.date} ${time}`);
      }
    }

    const updatedTask = await Task.findByIdAndUpdate(id, updatedFields, { new: true });

    if (!updatedTask) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    res.json({ success: true, message: 'Task updated successfully', updatedTask });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Server Port
const PORT = process.env.PORT || 7070;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
