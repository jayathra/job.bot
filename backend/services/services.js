import {
    DOC_CHUNKING_DEVELOPER_PROMPT,
    JOB_POSTING_CHUNKING_DEVELOPER_PROMPT
} from './promptsShort.js';
import { zodTextFormat } from "openai/helpers/zod";
import { format } from './serviceUtils.js'

import { ChromaClient } from "chromadb";
import { OpenAIEmbeddingFunction } from "@chroma-core/openai";
import OpenAI from "openai";
import axios from 'axios';

import { chunkSchema, parseFiles, verifyChunks, vectorDbPrep } from './serviceUtils.js';

import dotenv from 'dotenv';
dotenv.config()

const openAiClient = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

const chromaClient = new ChromaClient({
    host: "localhost",
    port: "8000"
});

const jobDocCollection = await chromaClient.getOrCreateCollection({
    name: "jobDocs",
    embeddingFunction: new OpenAIEmbeddingFunction({
        apiKey: process.env.OPENAI_API_KEY,
        modelName: "text-embedding-3-small"
    })
});

export const llmChunking = async (devPrompt, userPrompt) => {

    console.log("Frontier LLM chunking initialized")
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
    
    console.log("Local LLM chunking initialized")
    const response = await axios.post('http://localhost:11434/api/generate', {
        model: 'qwen3:8b',
        prompt: `${devPrompt}\n\n${userPrompt}`,
        stream: false,
        format
    });

    // The Ollama API returns the response as a string, so parse the JSON from the response
    const parsedResponse = JSON.parse(response.data.response);

    return new Set(parsedResponse.chunks);
}

// Helper to select the correct chunking function
export const getChunks = async (model, devPrompt, userPrompt) => {
    return model === 'qwen'
        ? await localLlmChunking(devPrompt, userPrompt)
        : await llmChunking(devPrompt, userPrompt);
};

export const chunkWithVerification = async ({ model, devPrompt, userPrompt, verifyAgainst, maxAttempts = 5 }) => {
    let chunks;
    let verified = false;
    let attempts = 0;

    while (!verified && attempts < maxAttempts) {
        chunks = await getChunks(model, devPrompt, userPrompt);
        verified = verifyChunks(chunks, verifyAgainst).verified;
        attempts++;
        if (!verified) {
            console.log(`Chunk verification failed (attempt ${attempts}). Retrying...`, verified.idxArray);
        }
        console.log("Chunk verification completed: ", verified)
    }

    return chunks;
}

export const processor = async (files, jobPostingText, model = 'gpt') => {
    // Parse and concatenate PDFs
    const concatParsedPdfs = await parseFiles(files);

    // Prepare prompts
    const userPromptDocs = `Please chunk the following career documents:\n\n${concatParsedPdfs}`;
    const userPromptJobPosting = `Please chunk the following job posting:\n\n${jobPostingText}`;

    const docChunks = await chunkWithVerification({
        model,
        devPrompt: DOC_CHUNKING_DEVELOPER_PROMPT,
        userPrompt: userPromptDocs,
        verifyAgainst: concatParsedPdfs
    });

    const jobPostingChunks = await chunkWithVerification({
        model,
        devPrompt: JOB_POSTING_CHUNKING_DEVELOPER_PROMPT,
        userPrompt: userPromptJobPosting,
        verifyAgainst: jobPostingText
    });

    // Prepare and upsert to ChromaDB
    const { documents, metadatas, ids } = vectorDbPrep(docChunks);
    await jobDocCollection.upsert({ documents, metadatas, ids });

    console.log("Document chunks are: ", docChunks);
    console.log("Job Posting chunks are: ", jobPostingChunks);

    return { docChunks, jobPostingChunks };
};









