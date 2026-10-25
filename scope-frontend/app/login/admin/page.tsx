"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { saveAuth } from "@/lib/auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await axios.post(`${API_BASE}/auth/login`, { email, password });
      if (data.user.role !== "ADMIN") {
        setError("Access denied. This account does not have admin privileges.");
        return;
      }
      saveAuth(data.token, data.user);
      router.push("/dashboard/admin");
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error ?? "Login failed. Please try again.");
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#1a1145] via-[#211654] to-[#2a1b6b] px-6">
      {/* Login Card */}
      <div className="w-full max-w-lg rounded-[40px] bg-white/[0.07] backdrop-blur-xl border border-white/[0.1] px-8 py-14 sm:px-12 sm:py-16">
        {/* Icon */}
        <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-purple-500/20 border border-purple-400/30">
          <svg
            className="h-10 w-10 text-purple-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"
            />
          </svg>
        </div>

        {/* Badge */}
        <div className="mb-4 flex justify-center">
          <span className="px-4 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs font-semibold border border-purple-400/30 tracking-wide uppercase">
            Admin Portal
          </span>
        </div>

        {/* Title */}
        <h1 className="mb-2 text-center text-3xl font-extrabold text-white sm:text-4xl">
          Admin Sign In
        </h1>
        <p className="mb-10 text-center text-base text-white/50">
          Restricted access — authorised personnel only
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-white/90">
              Admin Email
            </label>
            <div className="flex items-center gap-3 rounded-2xl bg-white/[0.06] border border-white/[0.1] px-5 py-4">
              <svg
                className="h-5 w-5 shrink-0 text-white/40"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
                />
              </svg>
              <input
                id="admin-email"
                type="email"
                placeholder="admin@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent text-base text-white placeholder-white/30 outline-none"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-white/90">
              Password
            </label>
            <div className="flex items-center gap-3 rounded-2xl bg-white/[0.06] border border-white/[0.1] px-5 py-4">
              <svg
                className="h-5 w-5 shrink-0 text-white/40"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
                />
              </svg>
              <input
                id="admin-password"
                type="password"
                placeholder="Enter admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent text-base text-white placeholder-white/30 outline-none"
                required
              />
            </div>
          </div>

          {/* Error message */}
          {error && (
            <p className="rounded-xl bg-red-500/20 border border-red-400/30 px-4 py-3 text-sm text-red-300 text-center">
              {error}
            </p>
          )}

          {/* Sign In button */}
          <button
            type="submit"
            id="admin-login-submit"
            disabled={loading}
            className="w-full rounded-2xl bg-gradient-to-r from-purple-700 to-violet-600 py-5 text-lg font-bold text-white shadow-lg transition-all duration-300 hover:from-purple-600 hover:to-violet-500 hover:shadow-xl hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-purple-400/50 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Verifying…" : "Sign In to Admin Panel"}
          </button>
        </form>

        {/* Back link */}
        <Link
          href="/login"
          className="mt-8 flex items-center justify-center gap-2 text-base font-medium text-white/60 transition-colors hover:text-white"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
            />
          </svg>
          Back to Role Selection
        </Link>
      </div>
    </div>
  );
}
