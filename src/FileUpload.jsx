import { useState } from 'react';
import { styled } from '@mui/material/styles';
import Button from '@mui/material/Button';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';

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
    
    const VisuallyHiddenInput = styled('input')({
          clip: 'rect(0 0 0 0)',
          clipPath: 'inset(50%)',
          height: 1,
          overflow: 'hidden',
          position: 'absolute',
          bottom: 0,
          left: 0,
          whiteSpace: 'nowrap',
          width: 1,
        });
    
    return (
        <div>
            <Button
                component="label"
                role={undefined}
                variant="contained"
                tabIndex={-1}
                startIcon={<CloudUploadIcon />}
            >
                Upload files
                <VisuallyHiddenInput
                type="file"
                onChange={(e) => fileUploadHandler(e)}
                multiple
            />
            </Button>
            
            {files.length > 0 && (
                <div>
                    <h3>Uploaded Files:</h3>
                    <ul>
                        {files.map((file, index) => (
                            <li key={index}>
                                {file.name} ({(file.size / 1024).toFixed(2)} KB)
                                <IconButton onClick={() => fileDeleteHandler(index)} aria-label="delete"><DeleteIcon /></IconButton>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    )
}