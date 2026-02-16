//.env
FRONTEND_URL=http://localhost:3000
GOOGLE_CLIENT_ID=5-cjsd8g7o6f08rh.appsleusne.m
GOOGLE_CLIENT_SECRET=ZtA4JADqn
GOOGLE_CALLBACK_URL=http://localhost:5000/auth/google/callbac

//login.js
<a href={`${SERVER_URL}/auth/google/callback`} />

//app.js
app.use(passport.initialize());

// config/google_oAuth.js
const googleConfig = {
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  // Use full callback URL in production (e.g. https://yourdomain.com/auth/google/callback)
  callbackURL: process.env.GOOGLE_CALLBACK_URL || "/auth/google/callback",
  scope: ["profile", "email"],
};

export default googleConfig;

// config/passport
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import userModel from "../models/user_model.js";
import googleConfig from "./google_oauth.js";
import { OldUserExist } from "../services/auth_services.js";

passport.use(
  new GoogleStrategy(
    {
      clientID: googleConfig.clientID,
      clientSecret: googleConfig.clientSecret,
      callbackURL: googleConfig.callbackURL,
      scope: googleConfig.scope,
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        // Find existing user by email
        let user = await userModel.findOne({ email });

        if (user) {
          // If user already has a Google provider linked, ensure id matches
          const hasGoogle = user.providers?.some((p) => p.name === "google");

          if (hasGoogle) {
            return done(null, user);
          }

          // If the user has a local password, do NOT auto-link.
          // Redirect flow will instruct frontend to let user link accounts explicitly.
          if (user.password) {
            // attach info to request so the callback route can redirect accordingly
            req.linkAccount = true;
            req.linkEmail = email;
            req.linkProviderId = profile.id;
            return done(null, user);
          }

          // Otherwise safe to link (no local password set)
          user.googleId = profile.id;
          user.providers = user.providers || [];
          user.providers.push({ name: "google", providerId: profile.id });
          user.provider = "google";
          await user.save();
          return done(null, user);
        }

        const { tokens, lastTokenReset } = await OldUserExist(email);

        // Create new user because none exists with this email
        user = await userModel.create({
          name: profile.name?.givenName || "",
          surname: profile.name?.familyName || "",
          email,
          googleId: profile.id,
          providers: [{ name: "google", providerId: profile.id }],
          provider: "google",
          password: null,
          tokens,
          lastTokenReset,
        });

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    },
  ),
);

//routes
// Start Google OAuth (optionally add ?link=1 to signal linking intent)
router.get("/auth/google", initiateGoogle);

// Callback route used by Google OAuth
router.get(
  "/auth/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/login" }),
  googleCallback,
);

// Link an OAuth provider to the logged-in account
router.post("/auth/link-provider", verifyAuth, linkProvider);

// contoller/OAuth_controller
import passport from "passport";
import jwt from "jsonwebtoken";
import { createSessionForUser } from "../services/oauth_service.js";
import crypto from "crypto";
import googleConfig from "../config/google_oauth.js";

// Initiate Google OAuth
export const initiateGoogle = (req, res, next) => {
  // Optionally frontend can pass a `link` query param when user explicitly links accounts
  // Ensure we pass the exact callback URL so Google receives the same redirect_uri
  const options = {
    scope: ["profile", "email"],
    session: false,
    callbackURL: googleConfig.callbackURL,
  };
  if (req.query.link === "1") {
    // mark linking intent so passport callback can detect
    req.query.link = "1";
  }
  passport.authenticate("google", options)(req, res, next);
};

// Callback handler — creates session tokens or redirects to linking UI
export const googleCallback = async (req, res, next) => {
  try {
    // passport strategy attaches user and optional linking info on req
    const user = req.user;
  

    // Normal login via Google — create cookies and session
    await createSessionForUser(jwt, user, res, req);

    // Redirect to app
    const frontendUrl = process.env.FRONTEND_URL;
    return res.redirect(`${frontendUrl}`);
  } catch (err) {
    return next(err);
  }
};

// Endpoint for authenticated users to link a provider to their account
export const linkProvider = async (req, res) => {
  try {
    const { provider, providerId, email } = req.body;
    const { userid } = req.user || {};
    if (!provider || !providerId) {
      return res.status(400).json({ success: false, message: "Missing provider data" });
    }

    // Ensure the requester owns the account or email matches
    if (!userid) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }

    const userModel = (await import("../models/user_model.js")).default;
    const user = await userModel.findById(userid);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    // Prevent linking a provider that is already attached to another account
    const existing = await userModel.findOne({ "providers.providerId": providerId, "providers.name": provider });
    if (existing && existing._id.toString() !== userid) {
      return res.status(409).json({ success: false, message: "Provider already linked to another account" });
    }

    user.providers = user.providers || [];
    if (!user.providers.some((p) => p.name === provider && p.providerId === providerId)) {
      user.providers.push({ name: provider, providerId });
    }

    if (provider === "google") {
      user.googleId = providerId;
      user.provider = user.provider === "local" ? "local" : "google";
    }

    await user.save();

    return res.json({ success: true, message: "Provider linked" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// services/OAuth_Services
import crypto from "crypto";
import { Session } from "../models/session_model.js";
import { createAccessToken, createRefreshToken } from "./auth_services.js";

export const createSessionForUser = async (jwt, user, res, req, accessExpiry = "15m", refreshExpiryDays = 7) => {
  // create access + refresh cookies using existing helpers
  createAccessToken(jwt, user, res);
  await createRefreshToken(jwt, user, res, req);

  // Session creation is handled inside createRefreshToken (it already stores tokenHash),
  // but we return a lightweight session info for caller convenience.
  return { success: true };
};

export const hashToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};


//FLOW
Frontend (3000)
    ↓
GET /auth/google
    ↓
Passport builds Google URL
    ↓
Google login screen
    ↓
Google redirects to:
    /auth/google/callback?code=abc
    ↓
Passport verifies code
    ↓
GoogleStrategy runs
    ↓
User found / created
    ↓
createSessionForUser()
    ↓
Set HTTP-only cookies
    ↓
Redirect to frontend



