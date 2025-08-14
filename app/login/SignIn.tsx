"use client";

import { BarChart3 } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { checkAuth } from "../_util/auth";

const SignInPage = () => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const [signIn, setSignIn] = useState(true);
  const [error, setError] = useState("");

  const router = useRouter();

   useEffect(() => {
      
  
      const fetchAuth = async () => {
        const user = await checkAuth();

        if (user && "message" in user) {
          console.error(user.message);
        } else {
          router.push("/")
        }
      };

      try {
        fetchAuth();
      } catch (err) {
        if (err instanceof Error) {
          console.error(err.message);
        }
      }
    }, [router]);
  
  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // prevents page reload

    const url = signIn
      ? "http://localhost:8080/api/auth/login"
      : "http://localhost:8080/api/auth/register";

    try {
      const response = await fetch(url, {
        method: "POST",
        credentials: 'include',   // IMPORTANT to receive and send cookies
        mode: 'cors',             // Ensure CORS is enabled
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Invalid credentials or server error");
      }

      const data = await response.json();
      console.log("Response data:", data);

      router.push("/"); // Redirect to home page
    } catch (err) {
      console.error("Error during sign-in or registration:", err);
      setError(err instanceof Error ? err.message : "Unexpected error");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground mx-auto overflow-y-auto h-full">
      {/* Logo / Nav */}
      <div className="flex items-start mb-8 mt-4 mx-8 gap-2">
        <BarChart3 className="h-8 w-8 text-primary" />
        <div className="text-3xl">TradePro</div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col my-8 items-center h-16 bg-secondary text-2xl font-bold text-primary">
        <h2 className="text-3xl text-success text-center my-12">
          Welcome to Trade Pro
          <p className="text-xl text-muted-foreground text-center mt-4">
            Simulate trades. Build skills. Win big later
          </p>
        </h2>

        {/* Form */}
        <form
          onSubmit={handleSignIn} // ✅ handle submit here
          className="flex flex-col gap-8 bg-secondary text-lg p-8 rounded-lg bg-gray-800 shadow-md w-1/2 h-full"
        >
          <h2 className="text-2xl font-bold mb-4 text-center">
            {signIn ? "Sign in to TradePro" : "Sign Up For TradePro"}
          </h2>

          <input
            type="text"
            placeholder="Username"
            className="p-2 border border-border rounded bg-white text-black"
            autoComplete="username"
            onChange={(e) =>
              setFormData({ ...formData, username: e.target.value })
            }
          />

          <input
            type="password"
            placeholder="Password"
            className="p-2 border border-border rounded bg-white text-black"
            autoComplete="current-password"
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
          />

          <button
            type="submit" // ✅ no onClick here
            className="bg-black text-green p-2 rounded hover:bg-blue-500 transition cursor-pointer"
          >
            {signIn ? "Sign In" : "Sign Up"}
          </button>

          <button
            type="button"
            className="text-sm text-gray-500 text-center mt-4 cursor-pointer hover:text-blue-500 transition"
            onClick={() => setSignIn(!signIn)}
          >
            {signIn ? "Don't have an account? " : "Already have an account? "}
          </button>

          {error && <p className="text-red-500 text-center">{error}</p>}
        </form>
      </div>
    </div>
  );
};

export default SignInPage;
