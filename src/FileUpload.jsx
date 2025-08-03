import { useState } from 'react';
import ListFiles from './ListFiles';
import FileUploadButton from './FileUploadButton';
import SubmitFiles from './SubmitFiles';
import axios from 'axios';

export default function FileUpload() {

    const [files, setFiles] = useState([]);

    const fileUploadHandler = (e) => {
        const newFiles = Array.from(e.target.files);
        setFiles(prevFiles => [...prevFiles, ...newFiles]);
        console.log(newFiles)
    }

    const fileDeleteHandler = (indexToDelete) => {
        setFiles(prevFiles => prevFiles.filter((_, index) => index !== indexToDelete))
    }

    const submitFileHandler = async () => {
        
        if (files.length === 0) return;

        const formData = new FormData();

        files.forEach(file => {
            formData.append('files', file);
        })

        try {
            const response = await axios.post('http://localhost:5000/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            })
            console.log('Upload successful:', response.data);
        } catch (error) {
            console.error('Upload failed:', error)
        }
    }
    
    return (
        <>
            <FileUploadButton fileUploadHandler={fileUploadHandler} />           
            {files.length > 0 && (
                <>
                <ListFiles files={files} fileDeleteHandler={fileDeleteHandler} />
                <SubmitFiles submitFileHandler={submitFileHandler} />
                </>
            )}
        </>
    )
}