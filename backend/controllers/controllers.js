import { processor } from "../services/services.js";

export const uploader = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        error: "No files uploaded",
      });
    }

    if (!req.body.jobPosting || req.body.jobPosting.trim() === "") {
      return res.status(400).json({
        error: "Job posting is required",
      });
    }

    if (req.session.googleTokens) {
      console.log("Sending uploaded documents and job posting for processing");
      const result = await processor(
        req.files,
        req.body.jobPosting,
        req.body.model,
        req.session.googleTokens
      );

      res.json({
        jobPostingChunks: result.jobPostingChunks,
        docChunks: result.docChunks,
        coverLetter: result.coverLetter,
        url: result.url,
      });
    } else {
      console.error("User is trying to upload documents without auth tokens");
      return res
        .status(500)
        .send("User is trying to upload documents without auth tokens");
    }
  } catch (error) {
    console.error("Upload processing failed:", error);

    res.status(500).json({
      success: false,
      error: "Failed to process document upload",
      message: error.message,
    });
  }
};
