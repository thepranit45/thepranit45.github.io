const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();

// MongoDB connection
mongoose.connect('mongodb://127.0.0.1:27017/fileUploadDB', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// File schema
const fileSchema = new mongoose.Schema({
    filename: String,
    originalname: String,
    contentType: String,
    data: Buffer
});

const File = mongoose.model('File', fileSchema);

// Set EJS as templating engine
app.set('view engine', 'ejs');

// Body parser
app.use(express.urlencoded({ extended: true }));

// Multer config - storing file in memory to save in DB
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Routes
app.get('/', async (req, res) => {
    const files = await File.find();
    res.render('index', { files });
});

app.post('/upload', upload.array('files'), async (req, res) => {
    const files = req.files;

    for (let file of files) {
        const newFile = new File({
            filename: file.filename,
            originalname: file.originalname,
            contentType: file.mimetype,
            data: file.buffer
        });
        await newFile.save();
    }

    res.redirect('/');
});

app.get('/file/:id', async (req, res) => {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).send('File not found');

    res.set('Content-Type', file.contentType);
    res.send(file.data);
});

app.listen(3000, () => {
    console.log('Server started on http://localhost:3000');
});
