require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB connection error:', err));

const TaskSchema = new mongoose.Schema({
  date: String,
  time: String,
  task: String,
  datetime: Date,
});

const Task = mongoose.model('Task', TaskSchema);

app.post('/save-task', async (req, res) => {
  try {
    const { date, time, task } = req.body;
    if (!date || !time || !task) {
      return res.status(400).json({ success: false, message: 'Missing fields' });
    }

    const dateSort = new Date(`${date}`);
    const timeSort = new Date(`${time}`);

    const newTask = new Task({ date, time, task, datetime });
    await newTask.save();
    res.json({ success: true, message: 'Task saved!', data: newTask });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/get-tasks', async (req, res) => {
  try {
    const tasks = await Task.find().sort({ dateSort: 1, timeSort: 1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tasks' });
  }
});

app.delete('/delete-task/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid task ID' });
    }

    const deletedTask = await Task.findByIdAndDelete(id);

    if (!deletedTask) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    res.json({ success: true, message: 'Task deleted successfully', deletedTask });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

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

    if (date || time) {
      const current = await Task.findById(id);
      if (current) {
        updatedFields.datetime = new Date(`${date || current.date} ${time || current.time}`);
      }
    }

    const updatedTask = await Task.findByIdAndUpdate(id, updatedFields, { new: true });

    if (!updatedTask) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    res.json({ success: true, message: 'Task updated successfully', updatedTask });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = process.env.PORT || 7070;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
