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

  private generateCodeVerifier(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");
  }

  private async generateCodeChallenge(verifier: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const digest = await crypto.subtle.digest("SHA-256", data);
    return btoa(String.fromCharCode(...new Uint8Array(digest)))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");
  }

  async initiateAuth(): Promise<void> {
    const codeVerifier = this.generateCodeVerifier();
    const codeChallenge = await this.generateCodeChallenge(codeVerifier);

    sessionStorage.setItem("spotify_code_verifier", codeVerifier);

    const params = new URLSearchParams({
      client_id: SPOTIFY_CONFIG.CLIENT_ID,
      response_type: "code",
      redirect_uri: SPOTIFY_CONFIG.REDIRECT_URI,
      code_challenge_method: "S256",
      code_challenge: codeChallenge,
      scope: SPOTIFY_CONFIG.SCOPES,
      show_dialog: "true",
    });

    const authUrl = `${SPOTIFY_CONFIG.AUTH_URL}?${params.toString()}`;
    window.location.href = authUrl;
  }

  async handleCallback(code: string): Promise<boolean> {
    try {
      const codeVerifier = sessionStorage.getItem("spotify_code_verifier");
      if (!codeVerifier) throw new Error("Code verifier not found");

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
        const errorText = await response.text();
        throw new Error(`Token exchange failed: ${errorText}`);
      }

      const tokens: TokenResponse = await response.json();
      this.storeTokens(tokens);

      // Clean up
      sessionStorage.removeItem("spotify_code_verifier");

      return true;
    } catch (err) {
      console.error("Error handling OAuth callback:", err);
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

    sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(storedTokens));
  }

  /**
   * Get stored tokens
   */
  private getStoredTokens(): StoredTokens | null {
    try {
      const stored = sessionStorage.getItem(this.STORAGE_KEY);
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
    sessionStorage.removeItem(this.STORAGE_KEY);

    // Clean up any remaining code verifiers (they start with spotify_cv_)
    try {
      Object.keys(sessionStorage).forEach((key) => {
        if (key.startsWith("spotify_cv_")) {
          sessionStorage.removeItem(key);
        }
      });
    } catch (e) {
      console.warn("🔐 Logout cleanup failed:", e);
    }
  }
}

export const spotifyAuth = new SpotifyAuthService();
