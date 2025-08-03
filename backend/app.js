import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fs from 'fs';
import pdf from 'pdf-parse/lib/pdf-parse.js';
import dotenv from 'dotenv';
import { ChromaClient } from "chromadb";

const client = new ChromaClient({
    host: "localhost",
    port: "8000"
});

dotenv.config();

const app = express();

// Configure multer for file uploads
const upload = multer();

// CORS Configuration
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
}));

app.use(express.json());

// API routes
app.get('/', (req, res) => {
    res.send('Hello World!')
});

app.post('/upload', upload.array('files', 5), async (req, res) => {
    
    if (req.files.length === 0 || !req.files) {
        console.log("No files uploaded")
    }

    const parsedPdfs = []
    const ids = []

    for (const file of req.files) {
        const data = await pdf(file.buffer);
        parsedPdfs.push(data.text)
        console.log(data)
        ids.push(crypto.randomUUID())
    }

    const collection = await client.getOrCreateCollection({
        name: "jobbot_collection",
        });

    await collection.upsert({
            documents: parsedPdfs,
            ids: ids,
        });

    res.json({
        files: req.files.map(file => ({
            originalname:file.originalname,
            size: file.size,
            path: file.path
        })),
        parsedData: parsedPdfs.map(file => ({
            text: file.text,
            numPages: file.numpages
        }))
    })
})
        
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});