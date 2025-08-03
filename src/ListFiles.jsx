import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';

export default function ListFiles({ files, fileDeleteHandler }) {
    return (
        <>
            <h3>Selected Files:</h3>
            <ul>
                {files.map((file, index) => (
                    <li key={index}>
                        {file.name} ({(file.size / 1024).toFixed(2)} KB)
                        <IconButton onClick={() => fileDeleteHandler(index)} aria-label="delete">
                            <DeleteIcon />
                        </IconButton>
                    </li>
                ))}
            </ul>
        </>
    )
}