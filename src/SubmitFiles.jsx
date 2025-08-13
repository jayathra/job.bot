import Button from '@mui/material/Button';

export default function SubmitFiles({ submitFileHandler, buttonText }) {
    
    return (
        <>
            <Button 
                onClick={submitFileHandler} 
                variant="outlined" 
            >
                {buttonText}
            </Button>
        </>   
    )
}