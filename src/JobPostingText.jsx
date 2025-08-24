import TextField from '@mui/material/TextField';

export default function JobPostingText({jobPostingInputHandler}) {
    return (
        <TextField
            fullWidth
            multiline
            rows={8}
            label="Copy and paste the job posting here"
            id="fullWidth" 
            margin="normal"
            onChange={(e) => jobPostingInputHandler(e)}
        />
    )
}