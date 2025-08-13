import pdf from 'pdf-parse/lib/pdf-parse.js';
import { z } from "zod";
import stringSimilarity from 'string-similarity';

// Local LLM chunking schema
export const format = {
    type: "object",
    properties: {
        chunks: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    section_type: { type: "string" },
                    content: { type: "string" },
                    char_count: { type: "integer" },
                    overlap_chars: { type: "integer" }
                },
                required: [
                    "section_type",
                    "content",
                    "char_count",
                    "overlap_chars"
                ]
            }
        }
    },
    required: ["chunks"]
};

// Schema definition for llm chunking
export const chunkSchema = z.object({
    chunks: z.array(
        z.object({
            section_type: z.string(),
            content: z.string(),
            char_count: z.number(),
            overlap_chars: z.number()
        })
    )
});

export const parseFiles = async (files) => {
    const parsedPdfs = []

    for (const file of files) {
        const data = await pdf(file.buffer);
        parsedPdfs.push(data.text)
    }

    return parsedPdfs
}

export const normalizeText = (str) => {
    return str
        .replace(/\r\n/g, '\n')         // Windows to Unix line endings
        .replace(/\r/g, '\n')           // Old Mac to Unix
        .replace(/[ \t]+/g, ' ')        // Collapse spaces/tabs
        .replace(/\u00A0/g, ' ')        // Non-breaking space to space
        .replace(/\u200B/g, '')         // Remove zero-width space
        .replace(/\n{2,}/g, '\n\n')     // Collapse multiple newlines
        .replace(/-\n/g, '')            // Remove hyphenation at line breaks
        .replace(/[•·●▪‣]/g, '*')       // Normalize bullet characters
        .trim()
        .normalize('NFC');              // Unicode normalization
}

export const verifyChunks = (chunkArray, fullText) => {
    const normFull = normalizeText(fullText);
    let verified = true;
    let idxArray = [];

    for (let i = 0; i < chunkArray.length; i++) {
        const normChunk = normalizeText(chunkArray[i].content);
        // Try to find a substring in normFull that is at least 95% similar
        let found = false;
        for (let j = 0; j <= normFull.length - normChunk.length; j++) {
            const candidate = normFull.substr(j, normChunk.length);
            const similarity = stringSimilarity.compareTwoStrings(normChunk, candidate);
            if (similarity > 0.95) {
                found = true;
                break;
            }
        }
        if (!found) {
            verified = false;
            idxArray.push(i);
            console.log('FAILED CHUNK:', chunkArray[i].content);
            console.log('NORMALIZED CHUNK:', normChunk);
        }
    }
    return { verified, idxArray };
}