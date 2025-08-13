import {
    DOC_CHUNKING_DEVELOPER_PROMPT,
    JOB_POSTING_CHUNKING_DEVELOPER_PROMPT
} from './promptsShort.js';
import { zodTextFormat } from "openai/helpers/zod";
import { format } from './serviceUtils.js'

// import { ChromaClient } from "chromadb";
import OpenAI from "openai";
import axios from 'axios';

import { chunkSchema, parseFiles, verifyChunks } from './serviceUtils.js';

import dotenv from 'dotenv';
dotenv.config()

const openAiClient = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// const chromaClient = new ChromaClient({
//     host: "localhost",
//     port: "8000"
// });

// const collection = await chromaClient.getOrCreateCollection({
//     name: "jobbot_collection",
// });

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
        temperature: 0, // Low temperature for consistency
        max_output_tokens: 4000,
        text: { format: zodTextFormat(chunkSchema, "chunk_array") }
    });

    const parsedResponse = JSON.parse(response.output_text)

    return parsedResponse.chunks;
}

export const localLlmChunking = async (devPrompt, userPrompt) => {
    const response = await axios.post('http://localhost:11434/api/generate', {
        model: 'qwen3:8b',
        prompt: `${devPrompt}\n\n${userPrompt}`,
        stream: false,
        format
    });

    // The Ollama API returns the response as a string, so parse the JSON from the response
    const parsedResponse = JSON.parse(response.data.response);

    return parsedResponse.chunks;
}

export const processor = async (files, jobPostingText, mode = 'gpt') => {
    const parsedPdfs = await parseFiles(files)
    const concatParsedPdfs = parsedPdfs.join("\n\nNext Document\n\n")
    const userPromptDocs = `Please chunk the following career documents:\n\n${concatParsedPdfs}`

    let docChunks, jobPostingChunks;

    if (mode === 'qwen') {
        docChunks = await localLlmChunking(DOC_CHUNKING_DEVELOPER_PROMPT, userPromptDocs)
    } else {
        docChunks = await llmChunking(DOC_CHUNKING_DEVELOPER_PROMPT, userPromptDocs)
    }
    console.log("Document chunk verification: ", verifyChunks(docChunks, concatParsedPdfs));
    console.log("Document chunks are: ", docChunks);

    const userPromptJobPosting = `Please chunk the following job posting:\n\n${jobPostingText}`
    if (mode === 'qwen') {
        jobPostingChunks = await localLlmChunking(JOB_POSTING_CHUNKING_DEVELOPER_PROMPT, userPromptJobPosting)
    } else {
        jobPostingChunks = await llmChunking(JOB_POSTING_CHUNKING_DEVELOPER_PROMPT, userPromptJobPosting)
    }
    console.log("Job posting chunk verification: ", verifyChunks(jobPostingChunks, jobPostingText));
    console.log("Job Posting chunks are: ", jobPostingChunks);

    return { docChunks, jobPostingChunks }
}

