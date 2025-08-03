import Button from '@mui/material/Button';

export default function SubmitFiles({ submitFileHandler }) {
    
    return (
        <>
            <Button 
                onClick={submitFileHandler} 
                variant="outlined" 
            >
                Extract Text from PDFs
            </Button>
        </>   
    )
}