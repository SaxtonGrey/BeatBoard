/**
 * Spotify Authentication Service
 *
 * Handles OAuth 2.0 Authorization Code Flow with PKCE for secure authentication.
 * This service manages token storage, refresh, and validation.
 */

import { SPOTIFY_CONFIG } from "../config/spotify";

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
}

interface StoredTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  scope: string;
}

class SpotifyAuthService {
  private readonly STORAGE_KEY = "spotify_tokens";

  /**
   * Generate a cryptographically secure code verifier for PKCE
   */
  private generateCodeVerifier(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");
  }

  /**
   * Generate code challenge from verifier
   */
  private async generateCodeChallenge(verifier: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const digest = await crypto.subtle.digest("SHA-256", data);
    return btoa(String.fromCharCode(...new Uint8Array(digest)))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");
  }

  /**
   * Initiate Spotify OAuth flow
   */
  async initiateAuth(): Promise<void> {
    console.log("🔐 Initiating Spotify auth...");
    const codeVerifier = this.generateCodeVerifier();
    const codeChallenge = await this.generateCodeChallenge(codeVerifier);

    // Store code verifier in multiple places for reliability
    const storageKey = `spotify_cv_${Date.now()}`;
    
    // Try multiple storage methods
    try {
      localStorage.setItem(storageKey, codeVerifier);
      console.log("🔐 Code verifier stored in localStorage with key:", storageKey);
    } catch (e) {
      console.warn("🔐 localStorage failed:", e);
    }
    
    try {
      sessionStorage.setItem(storageKey, codeVerifier);
      console.log("🔐 Code verifier stored in sessionStorage with key:", storageKey);
    } catch (e) {
      console.warn("🔐 sessionStorage failed:", e);
    }

    const params = new URLSearchParams({
      client_id: SPOTIFY_CONFIG.CLIENT_ID,
      response_type: "code",
      redirect_uri: SPOTIFY_CONFIG.REDIRECT_URI,
      code_challenge_method: "S256",
      code_challenge: codeChallenge,
      scope: SPOTIFY_CONFIG.SCOPES,
      show_dialog: "true",
      state: storageKey, // Pass the storage key as state parameter
    });
    
    const authUrl = `${SPOTIFY_CONFIG.AUTH_URL}?${params.toString()}`;
    console.log("🔐 Redirecting to:", authUrl);
    window.location.href = authUrl;
  }

  /**
   * Handle OAuth callback and exchange code for tokens
   */
  async handleCallback(code: string): Promise<boolean> {
    try {
      console.log("🔐 Handling OAuth callback with code:", code.substring(0, 10) + "...");
      
      // Get the state parameter from URL to find our code verifier
      const urlParams = new URLSearchParams(window.location.search);
      const state = urlParams.get("state");
      console.log("🔐 State parameter from URL:", state);
      
      if (!state) {
        throw new Error("State parameter missing from callback URL");
      }
      
      // Try to get code verifier from multiple storage locations
      let codeVerifier: string | null = null;
      
      // Try localStorage first
      try {
        codeVerifier = localStorage.getItem(state);
        if (codeVerifier) {
          console.log("🔐 Code verifier found in localStorage");
        }
      } catch (e) {
        console.warn("🔐 localStorage read failed:", e);
      }
      
      // Try sessionStorage as backup
      if (!codeVerifier) {
        try {
          codeVerifier = sessionStorage.getItem(state);
          if (codeVerifier) {
            console.log("🔐 Code verifier found in sessionStorage");
          }
        } catch (e) {
          console.warn("🔐 sessionStorage read failed:", e);
        }
      }
      
      if (!codeVerifier) {
        console.error("🔐 Code verifier not found in any storage");
        console.error("🔐 Available localStorage keys:", Object.keys(localStorage));
        console.error("🔐 Available sessionStorage keys:", Object.keys(sessionStorage));
        throw new Error("Code verifier not found");
      }

      const response = await fetch(SPOTIFY_CONFIG.TOKEN_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: SPOTIFY_CONFIG.CLIENT_ID,
          grant_type: "authorization_code",
          code,
          redirect_uri: SPOTIFY_CONFIG.REDIRECT_URI,
          code_verifier: codeVerifier,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error("Token exchange error:", errorData);
        throw new Error(`Token exchange failed: ${response.status} ${response.statusText}`);
      }

      const tokens: TokenResponse = await response.json();
      this.storeTokens(tokens);

      // Clean up
      if (state) {
        try {
          localStorage.removeItem(state);
          sessionStorage.removeItem(state);
          console.log("🔐 Code verifier cleaned up");
        } catch (e) {
          console.warn("🔐 Cleanup failed:", e);
        }
      }

      return true;
    } catch (error) {
      console.error("Error handling OAuth callback:", error);
      // Clean up on error - try to remove any code verifiers
      const urlParams = new URLSearchParams(window.location.search);
      const state = urlParams.get("state");
      if (state) {
        try {
          localStorage.removeItem(state);
          sessionStorage.removeItem(state);
        } catch (e) {
          console.warn("🔐 Error cleanup failed:", e);
        }
      }
      return false;
    }
  }

  /**
   * Store tokens securely in localStorage
   */
  private storeTokens(tokens: TokenResponse): void {
    const storedTokens: StoredTokens = {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: Date.now() + tokens.expires_in * 1000,
      scope: tokens.scope,
    };

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(storedTokens));
  }

  /**
   * Get stored tokens
   */
  private getStoredTokens(): StoredTokens | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  /**
   * Check if user is authenticated and token is valid
   */
  isAuthenticated(): boolean {
    const tokens = this.getStoredTokens();
    return tokens !== null && tokens.expiresAt > Date.now();
  }

  /**
   * Get valid access token (refresh if needed)
   */
  async getAccessToken(): Promise<string | null> {
    const tokens = this.getStoredTokens();
    if (!tokens) return null;

    // Token is still valid
    if (tokens.expiresAt > Date.now()) {
      return tokens.accessToken;
    }

    // Try to refresh token
    if (tokens.refreshToken) {
      return await this.refreshAccessToken(tokens.refreshToken);
    }

    return null;
  }

  /**
   * Refresh access token using refresh token
   */
  private async refreshAccessToken(
    refreshToken: string
  ): Promise<string | null> {
    try {
      const response = await fetch(SPOTIFY_CONFIG.TOKEN_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: SPOTIFY_CONFIG.CLIENT_ID,
          grant_type: "refresh_token",
          refresh_token: refreshToken,
        }),
      });

      if (!response.ok) {
        throw new Error("Token refresh failed");
      }

      const tokens: TokenResponse = await response.json();
      this.storeTokens({
        ...tokens,
        refresh_token: tokens.refresh_token || refreshToken, // Keep old refresh token if new one not provided
      });

      return tokens.access_token;
    } catch (error) {
      console.error("Error refreshing token:", error);
      this.logout();
      return null;
    }
  }

  /**
   * Logout user and clear stored tokens
   */
  logout(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    
    // Clean up any remaining code verifiers (they start with spotify_cv_)
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('spotify_cv_')) {
          localStorage.removeItem(key);
        }
      });
      Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith('spotify_cv_')) {
          sessionStorage.removeItem(key);
        }
      });
    } catch (e) {
      console.warn("🔐 Logout cleanup failed:", e);
    }
  }
}

export const spotifyAuth = new SpotifyAuthService();