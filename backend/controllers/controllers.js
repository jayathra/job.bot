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

    if (!req.session.googleTokens) {
      return res.json({
        authUrl: "http://localhost:5000/auth", // backend route that starts Google OAuth
      });
    } else {
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
