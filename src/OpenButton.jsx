import { Button } from "@mui/material";

export default function OpenButton({ url }) {
  return (
    <Button
      variant="contained"
      color="success"
      href={url}
      target="_blank"
      sx={{ mt: 2 }}
    >
      Open Cover Letter
    </Button>
  );
}
