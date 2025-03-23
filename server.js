require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());


mongoose.connect(process.env.MONGO_URI).then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB connection error:', err));


const TaskSchema = new mongoose.Schema({
  date: String,
  time: String,
  task: String
});
const Task = mongoose.model('Task', TaskSchema);


app.post('/save-task', async (req, res) => {
  try {
    const { date, time, task } = req.body;
    if (!date || !time || !task) {
      return res.status(400).json({ success: false, message: 'Missing fields' });
    }
    const newTask = new Task({ date, time, task });
    await newTask.save();
    res.json({ success: true, message: 'Task saved!', data: newTask });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});


app.get('/get-tasks', async (req, res) => {
  try {
    const tasks = await Task.find();
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tasks' });
  }
});


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


const PORT = process.env.PORT || 7070;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
