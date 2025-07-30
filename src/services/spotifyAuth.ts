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
  private readonly CODE_VERIFIER_KEY = "spotify_code_verifier";

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
    try {
      // Clear any existing tokens first
      this.logout();
      
      const codeVerifier = this.generateCodeVerifier();
      const codeChallenge = await this.generateCodeChallenge(codeVerifier);

      sessionStorage.setItem(this.CODE_VERIFIER_KEY, codeVerifier);

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
    } catch (error) {
      console.error("Error initiating auth:", error);
      throw new Error("Failed to initiate authentication");
    }
  }

  async handleCallback(code: string): Promise<boolean> {
    try {
      const codeVerifier = sessionStorage.getItem(this.CODE_VERIFIER_KEY);
      if (!codeVerifier) {
        throw new Error("Code verifier not found in session storage");
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
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Token exchange failed: ${errorData.error_description || response.statusText}`);
      }

      const tokens: TokenResponse = await response.json();
      this.storeTokens(tokens);

      // Clean up code verifier
      sessionStorage.removeItem(this.CODE_VERIFIER_KEY);

      return true;
    } catch (error) {
      console.error("Error handling OAuth callback:", error);
      // Clean up on error
      sessionStorage.removeItem(this.CODE_VERIFIER_KEY);
      return false;
    }
  }

  private storeTokens(tokens: TokenResponse): void {
    const storedTokens: StoredTokens = {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: Date.now() + (tokens.expires_in - 60) * 1000, // Subtract 60 seconds for buffer
      scope: tokens.scope,
    };

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(storedTokens));
  }

  private getStoredTokens(): StoredTokens | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error("Error parsing stored tokens:", error);
      this.logout();
      return null;
    }
  }

  isAuthenticated(): boolean {
    const tokens = this.getStoredTokens();
    return tokens !== null && tokens.expiresAt > Date.now();
  }

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

    // No refresh token available, need to re-authenticate
    this.logout();
    return null;
  }

  private async refreshAccessToken(refreshToken: string): Promise<string | null> {
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
        throw new Error(`Token refresh failed: ${response.statusText}`);
      }

      const tokens: TokenResponse = await response.json();
      this.storeTokens({
        ...tokens,
        refresh_token: tokens.refresh_token || refreshToken,
      });

      return tokens.access_token;
    } catch (error) {
      console.error("Error refreshing token:", error);
      this.logout();
      return null;
    }
  }

  logout(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    sessionStorage.removeItem(this.CODE_VERIFIER_KEY);
  }

  getStoredAccessToken(): string | null {
    const tokens = this.getStoredTokens();
    return tokens?.accessToken || null;
  }
}

export const spotifyAuth = new SpotifyAuthService();