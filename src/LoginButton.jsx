import Button from "@mui/material/Button";

export default function LoginButton({ loginHandler }) {
  return (
    <Button variant="contained" onClick={loginHandler}>
      Login
    </Button>
  );
}
