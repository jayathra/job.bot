import {
  DOC_CHUNKING_DEVELOPER_PROMPT,
  JOB_POSTING_CHUNKING_DEVELOPER_PROMPT,
  COVER_LETTER_CREATION_PROMPT,
} from "./promptsShort.js";
import { zodTextFormat } from "openai/helpers/zod";
import { format } from "./serviceUtils.js";

import { ChromaClient } from "chromadb";
import { OpenAIEmbeddingFunction } from "@chroma-core/openai";
import OpenAI from "openai";
import axios from "axios";
import { createClient } from "../controllers/oAuthControllers.js";

import {
  chunkSchema,
  parseFiles,
  verifyChunks,
  vectorDbPrep,
  deduplicateChunks,
} from "./serviceUtils.js";

import dotenv from "dotenv";
dotenv.config();

import { google } from "googleapis";

const openAiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const chromaClient = new ChromaClient({
  host: "localhost",
  port: "8000",
});

const jobDocCollection = await chromaClient.getOrCreateCollection({
  name: "jobDocs",
  embeddingFunction: new OpenAIEmbeddingFunction({
    apiKey: process.env.OPENAI_API_KEY,
    modelName: "text-embedding-3-small",
  }),
});

export const llmChunking = async (devPrompt, userPrompt) => {
  console.log("Frontier LLM chunking initialized");
  const response = await openAiClient.responses.create({
    model: "gpt-4o-mini",
    input: [
      {
        role: "developer",
        content: devPrompt,
      },
      {
        role: "user",
        content: userPrompt,
      },
    ],
    temperature: 0, // Low temperature for consistency
    max_output_tokens: 13000,
    text: { format: zodTextFormat(chunkSchema, "chunk_array") },
  });

  const parsedResponse = JSON.parse(response.output_text);

  return parsedResponse.chunks;
};

export const localLlmChunking = async (devPrompt, userPrompt) => {
  console.log("Local LLM chunking initialized");
  const response = await axios.post("http://localhost:11434/api/generate", {
    model: "qwen3:8b",
    prompt: `${devPrompt}\n\n${userPrompt}`,
    stream: false,
    options: {
      temperature: 0,
    },
    format,
  });

  // The Ollama API returns the response as a string, so parse the JSON from the response
  const parsedResponse = JSON.parse(response.data.response);

  return parsedResponse.chunks;
};

// Helper to select the correct chunking function
export const getChunks = async (model, devPrompt, userPrompt) => {
  return model === "qwen"
    ? await localLlmChunking(devPrompt, userPrompt)
    : await llmChunking(devPrompt, userPrompt);
};

export const chunkWithVerification = async ({
  model,
  devPrompt,
  userPrompt,
  verifyAgainst,
  maxAttempts = 5,
}) => {
  let chunks;
  let verified = false;
  let attempts = 0;

  while (!verified && attempts < maxAttempts) {
    chunks = await getChunks(model, devPrompt, userPrompt);
    verified = verifyChunks(chunks, verifyAgainst).verified;
    attempts++;
    if (!verified) {
      console.log(
        `Chunk verification failed (attempt ${attempts}). Retrying...`,
        verified.idxArray
      );
    }
    console.log("Chunk verification completed: ", verified);
  }

  return chunks;
};

export const frontierCoverLetterGenerator = async (devPrompt, userPrompt) => {
  console.log("Frontier LLM chunking initialized for cover letter generation");
  const response = await openAiClient.responses.create({
    model: "gpt-4o-mini",
    input: [
      {
        role: "developer",
        content: devPrompt,
      },
      {
        role: "user",
        content: userPrompt,
      },
    ],
    tools: [{ type: "web_search_preview" }],
    max_output_tokens: 8000,
  });

  return response.output_text;
};

const googleDocCreation = async (coverLetter, fullName, tokens) => {
  const oAuth2Client = createClient();
  oAuth2Client.setCredentials(tokens);
  const docs = google.docs({ version: "v1", auth: oAuth2Client });
  const drive = google.drive({ version: "v3", auth: oAuth2Client });
  const newDoc = await drive.files.create({
    requestBody: {
      name: `${fullName}'s Cover Letter`,
      mimeType: "application/vnd.google-apps.document",
      parents: ["1uAV_4fW5byS4XVn4ymxWlr09PUWSmRo6"],
    },
  });
  console.log(newDoc.data.id);
  const docId = newDoc.data.id;
  await drive.permissions.create({
    fileId: docId,
    requestBody: {
      type: "user",
      role: "owner",
      emailAddress: "jayathra.abeywarna@gmail.com",
    },
    transferOwnership: true,
  });
  await docs.documents.batchUpdate({
    documentId: docId,
    requestBody: {
      requests: [
        {
          insertText: {
            location: { index: 1 },
            text: coverLetter || "",
          },
        },
      ],
    },
  });
  const url = `https://docs.google.com/document/d/${docId}/edit`;
  return url;
};

export const processor = async (
  files,
  jobPostingText,
  model = "gpt",
  tokens
) => {
  // Parse and concatenate PDFs
  const concatParsedPdfs = await parseFiles(files);

  // Prepare prompts
  const userPromptDocs = `Please chunk the following career documents:\n\n${concatParsedPdfs}`;
  const userPromptJobPosting = `Please chunk the following job posting:\n\n${jobPostingText}`;

  console.log("Chunking user uploaded documents");
  const docChunks = await chunkWithVerification({
    model,
    devPrompt: DOC_CHUNKING_DEVELOPER_PROMPT,
    userPrompt: userPromptDocs,
    verifyAgainst: concatParsedPdfs,
  });

  console.log("Chunking job posting");
  const jobPostingChunks = await chunkWithVerification({
    model,
    devPrompt: JOB_POSTING_CHUNKING_DEVELOPER_PROMPT,
    userPrompt: userPromptJobPosting,
    verifyAgainst: jobPostingText,
  });

  // Prepare and upsert to ChromaDB
  console.log(
    "Preparing and sending user uploaded document chunks to ChromaDB"
  );
  const uniqueDocChunks = deduplicateChunks(docChunks);
  const { documents, metadatas, ids } = vectorDbPrep(uniqueDocChunks);
  try {
    await jobDocCollection.upsert({ documents, metadatas, ids });
  } catch (error) {
    console.log("Failed to upsert to ChromaDB with error: ", error);
    await chromaClient.deleteCollection({
      name: "jobDocs",
    });
  }

  //console.log("Document chunks are: ", docChunks);
  //console.log("Job Posting chunks are: ", jobPostingChunks);

  let results = {};

  for (let chunk of jobPostingChunks) {
    const relevantInfo = [
      "responsibility",
      "requirement_must_have",
      "requirement_nice_to_have",
      "attributes",
    ];
    if (relevantInfo.includes(chunk.section_type)) {
      const queryResult = await jobDocCollection.query({
        queryTexts: [chunk.content],
      });
      if (!results[chunk.section_type]) {
        results[chunk.section_type] = [];
      }
      results[chunk.section_type].push({
        content: chunk.content,
        document: queryResult.documents[0],
      });
    } else {
      if (!results[chunk.section_type]) {
        results[chunk.section_type] = [];
      }
      results[chunk.section_type].push({
        content: chunk.content,
        document: [],
      });
    }
  }

  let fullName;
  for (let chunk of docChunks) {
    if (chunk.section_type === "full_name") fullName = chunk.content;
  }

  let contactInfo;
  for (let chunk of docChunks) {
    if (chunk.section_type === "contact_info") contactInfo = chunk.content;
  }

  const userPromptCoverLetter = `The JSON object specified in the developer prompt is ${JSON.stringify(
    results
  )}. Please craft a cover letter for ${fullName}. The contact information is listed as follows: ${contactInfo}`;
  console.log(`Crafting cover letter for ${fullName}`);
  const coverLetter = await frontierCoverLetterGenerator(
    COVER_LETTER_CREATION_PROMPT,
    userPromptCoverLetter
  );
  console.log(coverLetter);

  await chromaClient.deleteCollection({
    name: "jobDocs",
  });

  const url = await googleDocCreation(coverLetter, fullName, tokens);
  console.log(url);

  return { docChunks, jobPostingChunks, coverLetter, url };
};
