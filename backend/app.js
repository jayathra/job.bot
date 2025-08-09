import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { uploader } from './controllers.js';

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

app.post('/upload', upload.array('files', 5), uploader)

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});


    
    // if (req.files.length === 0 || !req.files) {
    //     console.log("No files uploaded")
    // }

    // const parsedPdfs = []
    // const ids = []

    // for (const file of req.files) {
    //     const data = await pdf(file.buffer);
    //     parsedPdfs.push(data.text) 
    //     ids.push(crypto.randomUUID())
    // }

    // const chunkSchema = z.object({
    //     sections: z.array(
    //         z.object({
    //             section_type: z.string(),
    //             content: z.string(),
    //             char_count: z.number(),
    //             overlap_chars: z.number()
    //         })
    //     )
    // });

    // const responseDocs = await openAiClient.responses.create({
    //     model: "gpt-4o-mini",
    //     input: [
    //         {
    //             role: "developer", 
    //             content: DOC_CHUNKING_DEVELOPER_PROMPT
    //         },
    //         {
    //             role: "user",
    //             content: `Please chunk the following career documents:\n\n${parsedPdfs.join("\n\nNext Document\n\n")}`
    //         }
    //     ],
    //     temperature: 0.1, // Low temperature for consistency
    //     max_output_tokens: 4000,
    //     text: { format: zodTextFormat(chunkSchema, "chunk_array_docs") }
    // });

    // const docChunks = responseDocs.output_text;

    // console.log("document Chunks are: ", docChunks)
    

    // // console.log(parsedPdfs) // the strings in the parsedPdfs array needs to be sent to an LLM for chunking

    // const responseJobPosting = await openAiClient.responses.create({
    //     model: "gpt-4o-mini",
    //     input: [
    //         {
    //             role: "developer", 
    //             content: JOB_POSTING_CHUNKING_DEVELOPER_PROMPT
    //         },
    //         {
    //             role: "user",
    //             content: `Please chunk the following job posting:\n\n${req.body.jobPosting}`
    //         }
    //     ],
    //     temperature: 0.1, // Low temperature for consistency
    //     max_output_tokens: 4000,
    //     text: { format: zodTextFormat(chunkSchema, "chunk_array_job") }
    // });

    // const jobPostingChunks = responseJobPosting.output_text;

    // console.log("job posting chunks are: ", jobPostingChunks)

    // await collection.upsert({
    //         documents: parsedPdfs,
    //         ids: ids,
    //     });

    // const results = await collection.query({
    //     queryTexts: ["what are Jayathra's strengths?"]
    // })

    // res.json({
    //     files: req.files.map(file => ({
    //         originalname:file.originalname,
    //         size: file.size,
    //         path: file.path
    //     })),
    //     parsedData: parsedPdfs.map(file => ({
    //         text: file.text,
    //         numPages: file.numpages
    //     })),
    //     queryResults: [...new Set(results.documents[0])],
    //     parsedPDFs: parsedPdfs,
    //     jobPosting: req.body.jobPosting,
    //     jobPostingChunks: jobPostingChunks,
    //     docChunks: docChunks
    // })
// })