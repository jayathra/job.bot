import { useState } from 'react';
import ListFiles from './ListFiles';
import FileUploadButton from './FileUploadButton';
import SubmitFiles from './SubmitFiles';
import JobPostingText from './JobPostingText';
import ModelSelector from './modelSelector';
import axios from 'axios';
import UrlTextField from './UrlTextField';

export default function FileUpload() {

    const [files, setFiles] = useState([]);

    const [jobPosting, setJobPosting] = useState("");

    const [model, setModel] = useState("");

    const [url, setUrl] = useState("");

    const fileUploadHandler = (e) => {
        const newFiles = Array.from(e.target.files);
        setFiles(prevFiles => [...prevFiles, ...newFiles]);
        console.log(newFiles)
    }

    const fileDeleteHandler = (indexToDelete) => {
        setFiles(prevFiles => prevFiles.filter((_, index) => index !== indexToDelete))
    }

    const submitFileHandler = async (model) => {
        
        if (files.length === 0) return;

        const formData = new FormData();

        formData.append('jobPosting', jobPosting)
        formData.append('model', model)

        files.forEach(file => {
            formData.append('files', file);
        })

        if (jobPosting.trim()) {
            try {
                const response = await axios.post('http://localhost:5000/upload', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                })
                console.log('Upload successful:', response.data);
                setUrl(response.data.url)
            } catch (error) {
                console.error('Upload failed:', error)
            }
        }      
    }

    const jobPostingInputHandler = (e) => {
        setJobPosting(e.target.value)
    }

    const handleSelector = (e) => {
        setModel(e.target.value)
    }
    
    return (
        <>
            <FileUploadButton fileUploadHandler={fileUploadHandler} />         
            {files.length > 0 && (
                <>
                    <ListFiles files={files} fileDeleteHandler={fileDeleteHandler} />
                    <JobPostingText jobPostingInputHandler={jobPostingInputHandler}/>
                    {jobPosting.trim() && (
                        <ModelSelector handleSelector={handleSelector} model={model} />
                    )}
                    <div>
                        {jobPosting.trim() && model && (
                            <SubmitFiles submitFileHandler={() => submitFileHandler(model)} /> 
                        )}
                    </div>
                    {url !== "" && (
                        <UrlTextField url={url}/>
                    )}
                </>
            )}

        </>
    )
}