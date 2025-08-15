import pdf from 'pdf-parse/lib/pdf-parse.js';
import { z } from "zod";
import stringSimilarity from 'string-similarity';
import crypto from 'crypto';

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

// Frontier LLM chunking schema
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

    console.log("Parsing uploaded PDFs")
    const parsedPdfs = []

    for (const file of files) {
        const data = await pdf(file.buffer);
        parsedPdfs.push(data.text)
    }

    const concatParsedPdfs = parsedPdfs.join("\n\nNext Document\n\n");

    return concatParsedPdfs
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

    console.log("Chunk verification process initialized")
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
            console.log('Failed chunk: ', chunkArray[i].content);
            console.log('Normalized chunk: ', normChunk);
        }
    }
    return { verified, idxArray };
}

const hashContent = (content) => {
    return crypto.createHash('sha256').update(content).digest('hex');
} // CHANGE THIS TO UUID

export const vectorDbPrep = (chunkArray) => {
    const documents = chunkArray.map(chunk => chunk.content);
    const metadatas = chunkArray.map(chunk => ({
        section_type: chunk.section_type,
        char_count: chunk.char_count,
        overlap_chars: chunk.overlap_chars
    }));
    const ids = chunkArray.map(chunk => hashContent(normalizeText(chunk.content)));
    return { documents, metadatas, ids }
}

export const deduplicateChunks = (chunkArray) => {
    const seen = new Set();
    return chunkArray.filter(chunk => {
        const normContent = normalizeText(chunk.content);
        if (seen.has(normContent)) return false;
        seen.add(normContent);
        return true;
    });
}