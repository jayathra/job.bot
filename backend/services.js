import pdf from 'pdf-parse/lib/pdf-parse.js';
import { 
    DOC_CHUNKING_DEVELOPER_PROMPT,
    JOB_POSTING_CHUNKING_DEVELOPER_PROMPT 
    } from './prompts.js';
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";

import { ChromaClient } from "chromadb";
import OpenAI from "openai";

import dotenv from 'dotenv';
dotenv.config()

const openAiClient = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

const chromaClient = new ChromaClient({
    host: "localhost",
    port: "8000"
});

const collection = await chromaClient.getOrCreateCollection({
    name: "jobbot_collection",
    });

// Schema definition for llm chunking
const chunkSchema = z.object({
    chunks: z.array(
        z.object({
            section_type: z.string(),
            content: z.string(),
            char_count: z.number(),
            overlap_chars: z.number()
        })
    )
});

const parseFiles = async (files) => {
    const parsedPdfs = []

    for (const file of files) {
        const data = await pdf(file.buffer);
        parsedPdfs.push(data.text) 
    }

    return parsedPdfs
}

const verifyChunks = (chunkArray, fullText) => {
    return chunkArray.every(chunk => fullText.includes(chunk.content))
}

export const llmChunking = async (devPrompt, userPrompt) => {
    const response = await openAiClient.responses.create({
        model: "gpt-4o-mini",
        input: [
            {
                role: "developer", 
                content: devPrompt
            },
            {
                role: "user",
                content: userPrompt
            }
        ],
        temperature: 0.1, // Low temperature for consistency
        max_output_tokens: 4000,
        text: { format: zodTextFormat(chunkSchema, "chunk_array") }
    });

    const parsedResponse = JSON.parse(response.output_text)
   
    return parsedResponse.chunks;
}

export const processor = async (files, jobPostingText) => {
    
    const parsedPdfs = await parseFiles(files)
    const concatParsedPdfs = parsedPdfs.join("\n\nNext Document\n\n")

    const userPromptDocs = `Please chunk the following career documents:\n\n${concatParsedPdfs}`
    const docChunks = await llmChunking(DOC_CHUNKING_DEVELOPER_PROMPT, userPromptDocs)
    console.log(verifyChunks(docChunks, concatParsedPdfs))

    const userPromptJobPosting = `Please chunk the following job posting:\n\n${jobPostingText}`
    const jobPostingChunks = await llmChunking(JOB_POSTING_CHUNKING_DEVELOPER_PROMPT, userPromptJobPosting)
    console.log(verifyChunks(jobPostingChunks, jobPostingText))

    // console.log(docChunks)

    // console.log(jobPostingChunks)

    return { docChunks, jobPostingChunks }
}

