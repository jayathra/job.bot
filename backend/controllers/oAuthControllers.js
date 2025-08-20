import fs from "fs";
import crypto from "crypto";
import { google } from "googleapis";
import dotenv from "dotenv";
dotenv.config();

export const createClient = () => {
  const { web: oAuthKeys } = JSON.parse(
    fs.readFileSync(process.env.GOOGLE_OAUTH_KEY_PATH)
  );

  const oAuth2Client = new google.auth.OAuth2(
    oAuthKeys.client_id,
    oAuthKeys.client_secret,
    oAuthKeys.redirect_uris
  );

  return oAuth2Client;
};

export const googleOAuth = async (req, res) => {
  // config for google apis
  const scopes = [
    "https://www.googleapis.com/auth/documents",
    "https://www.googleapis.com/auth/drive",
  ];

  const oAuth2Client = createClient();

  const state = crypto.randomBytes(32).toString("hex");
  req.session.state = state;

  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
    include_granted_scopes: true,
    state: state,
  });

  res.redirect(authUrl);
};

export const googleOAuthCallback = async (req, res) => {
  const { code, state } = req.query;
  if (!code || !state || state !== req.session.state) {
    return res.status(400).send("Invalid OAuth state/code");
  }

  const oAuth2Client = createClient();

  const { tokens } = await oAuth2Client.getToken(code);
  oAuth2Client.setCredentials(tokens);
  req.session.googleTokens = tokens;
  res.redirect("http://localhost:5173");
};

export const googleOAuthStatus = async (req, res) => {
  res.json({ authorized: !!req.session.googleTokens });
};
