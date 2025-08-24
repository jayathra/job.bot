import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';

export default function UrlTextField ({ url }) {
    return (
        <Box sx={{ width: 500, maxWidth: '100%' }}>
            <TextField
                fullWidth
                label="Cover Letter URL will appear here"
                id="fullWidth"
                value={url} />
        </Box> 
    )
}