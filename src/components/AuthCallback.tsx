/**
 * OAuth Callback Component
 *
 * This component handles the OAuth callback from Spotify.
 * It should be rendered at the /callback route.
 */

import React, { useEffect, useState } from "react";
import { spotifyAuth } from "../services/spotifyAuth";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface AuthCallbackProps {
  onAuthComplete: (success: boolean) => void;
}

export const AuthCallback: React.FC<AuthCallbackProps> = ({
  onAuthComplete,
}) => {
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("Processing authentication...");
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get("code");
        const error = urlParams.get("error");

        if (error) {
          throw new Error(`Authentication error: ${error}`);
        }

        if (!code) {
          throw new Error("No authorization code received");
        }

        const success = await spotifyAuth.handleCallback(code);

        if (success) {
          setStatus("success");
          setMessage("Authentication successful! Redirecting...");

          // Redirect after a short delay
          setTimeout(() => {
            onAuthComplete(true);
            navigate("/");
          }, 2000);
        } else {
          throw new Error("Failed to exchange authorization code for tokens");
        }
      } catch (error) {
        console.error("Authentication callback error:", error);
        setStatus("error");
        setMessage(
          error instanceof Error ? error.message : "Authentication failed"
        );

        setTimeout(() => {
          onAuthComplete(false);
        }, 3000);
      }
    };

    handleCallback();
  }, [onAuthComplete]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
      <div className="bg-card-bg border border-gray-700 rounded-2xl p-8 max-w-md w-full mx-4 text-center">
        <div className="mb-6">
          {status === "loading" && (
            <Loader2 className="w-16 h-16 text-spotify-green mx-auto animate-spin" />
          )}
          {status === "success" && (
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
          )}
          {status === "error" && (
            <XCircle className="w-16 h-16 text-red-500 mx-auto" />
          )}
        </div>

        <h2 className="text-2xl font-bold text-white mb-4">
          {status === "loading" && "Connecting to Spotify"}
          {status === "success" && "Success!"}
          {status === "error" && "Authentication Failed"}
        </h2>

        <p className="text-gray-400">{message}</p>

        {status === "error" && (
          <button
            className="mt-4 px-4 py-2 bg-spotify-green text-white rounded"
            onClick={() => spotifyAuth.initiateAuth()}
          >
            Retry Login
          </button>
        )}

        {status === "loading" && (
          <div className="mt-6">
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-spotify-green h-2 rounded-full animate-pulse"
                style={{ width: "60%" }}
              ></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
