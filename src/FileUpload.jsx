import { useState, useEffect } from "react";
import ListFiles from "./ListFiles";
import FileUploadButton from "./FileUploadButton";
import SubmitFiles from "./SubmitFiles";
import JobPostingText from "./JobPostingText";
import ModelSelector from "./modelSelector";
import axios from "axios";
import LoginButton from "./LoginButton";
import Stack from "@mui/material/Stack";
import OpenButton from "./OpenButton";
import CircularProgress from "@mui/material/CircularProgress";

export default function FileUpload() {
  const [files, setFiles] = useState([]);

  const [jobPosting, setJobPosting] = useState("");

  const [model, setModel] = useState("");

  const [url, setUrl] = useState("");

  const [authorized, setAuthorized] = useState(false);

  const [checkingAuth, setCheckingAuth] = useState(true);

  const fileUploadHandler = async (e) => {
    const newFiles = Array.from(e.target.files);
    setFiles((prevFiles) => [...prevFiles, ...newFiles]);
    console.log(newFiles);
  };

  const fileDeleteHandler = (indexToDelete) => {
    setFiles((prevFiles) =>
      prevFiles.filter((_, index) => index !== indexToDelete)
    );
  };

  const submitFileHandler = async (model) => {
    if (files.length === 0) return;

    const formData = new FormData();

    formData.append("jobPosting", jobPosting);
    formData.append("model", model);

    files.forEach((file) => {
      formData.append("files", file);
    });

    if (jobPosting.trim()) {
      try {
        const response = await axios.post(
          "http://localhost:5000/upload",
          formData,
          {
            withCredentials: true,
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
        console.log("Upload successful:", response.data);
        setUrl(response.data.url);
      } catch (error) {
        console.error("Upload failed:", error);
      }
    }
  };

  const jobPostingInputHandler = (e) => {
    setJobPosting(e.target.value);
  };

  const handleSelector = (e) => {
    setModel(e.target.value);
  };

  const checkAuth = async () => {
    try {
      const response = await axios.get("http://localhost:5000/auth/status", {
        withCredentials: true,
      });
      setCheckingAuth(false);
      if (response.data.authorized) {
        setAuthorized(true);
      }
    } catch (err) {
      console.error("Auth check failed:", err);
      setAuthorized(false);
      setCheckingAuth(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const loginHandler = () => {
    window.location.href = "http://localhost:5000/auth";
  };

  return (
    <Stack direction="column" spacing={2}>
      {!authorized && !checkingAuth && (
        <LoginButton loginHandler={loginHandler} />
      )}
      {checkingAuth && <CircularProgress />}
      <h1>job.bot</h1>
      {authorized && <FileUploadButton fileUploadHandler={fileUploadHandler} />}
      {files.length > 0 && (
        <>
          <ListFiles files={files} fileDeleteHandler={fileDeleteHandler} />
          <JobPostingText jobPostingInputHandler={jobPostingInputHandler} />
          {jobPosting.trim() && (
            <ModelSelector handleSelector={handleSelector} model={model} />
          )}
          <div>
            {jobPosting.trim() && model && (
              <SubmitFiles submitFileHandler={() => submitFileHandler(model)} />
            )}
          </div>
          {url !== "" && <OpenButton url={url} />}
        </>
      )}
    </Stack>
  );
}
