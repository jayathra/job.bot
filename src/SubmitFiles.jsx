import Button from '@mui/material/Button';

export default function SubmitFiles({ submitFileHandler }) {
    
    return (
        <>
            <Button 
                onClick={submitFileHandler} 
                variant="outlined" 
            >
                SUBMIT
            </Button>
        </>   
    )
}