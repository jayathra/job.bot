import express from "express";
const app = express();
import cors from "cors";
import multer from "multer";
const upload = multer();
import { uploader } from "./controllers/controllers.js";
import session from "express-session";
import dotenv from "dotenv";
dotenv.config();
import {
  googleOAuth,
  googleOAuthCallback,
  googleOAuthStatus,
} from "./controllers/oAuthControllers.js";

// CORS Configuration
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);

app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // true if HTTPS
      httpOnly: true,
      sameSite: "lax", // required for cross-site cookies
    },
  })
);

// API routes
app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/auth", googleOAuth);

app.get("/auth/callback", googleOAuthCallback);

app.get("/auth/status", googleOAuthStatus);

app.post("/upload", upload.array("files", 5), uploader);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
