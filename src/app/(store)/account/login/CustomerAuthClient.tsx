"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export function CustomerAuthClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo") || "/account";

  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const endpoint = mode === "login" ? "/api/account/login" : "/api/account/register";
      const payload = mode === "login" ? { email, password } : { email, password, name, phone };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Authentication failed");
      }

      router.push(returnTo);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md w-full rounded-2xl border border-stone-200/80 bg-white p-6 sm:p-8 shadow-sm">
      {/* Tab Switcher */}
      <div className="flex border-b border-stone-200 mb-6">
        <button
          type="button"
          onClick={() => {
            setMode("login");
            setError(null);
          }}
          className={`flex-1 pb-3 text-center text-sm font-semibold transition ${
            mode === "login"
              ? "border-b-2 border-stone-900 text-stone-900 font-bold"
              : "text-stone-400 hover:text-stone-700"
          }`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("register");
            setError(null);
          }}
          className={`flex-1 pb-3 text-center text-sm font-semibold transition ${
            mode === "register"
              ? "border-b-2 border-stone-900 text-stone-900 font-bold"
              : "text-stone-400 hover:text-stone-700"
          }`}
        >
          Create Account
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-xl bg-red-50 p-3 text-xs font-medium text-red-800 border border-red-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {mode === "register" && (
          <div>
            <label className="block font-medium text-stone-700 mb-1">Full Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Helena Vance"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-stone-300 p-2.5 text-stone-900 focus:outline-none focus:border-stone-900"
            />
          </div>
        )}

        <div>
          <label className="block font-medium text-stone-700 mb-1">Email Address</label>
          <input
            type="email"
            required
            placeholder="helena@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-stone-300 p-2.5 text-stone-900 focus:outline-none focus:border-stone-900"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block font-medium text-stone-700">Password</label>
            {mode === "login" && (
              <span className="text-[11px] text-stone-400">At least 8 characters</span>
            )}
          </div>
          <input
            type="password"
            required
            minLength={8}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-stone-300 p-2.5 text-stone-900 focus:outline-none focus:border-stone-900"
          />
        </div>

        {mode === "register" && (
          <div>
            <label className="block font-medium text-stone-700 mb-1">
              Phone Number{" "}
              <span className="text-stone-400 font-normal">
                (Optional, for delivery notifications)
              </span>
            </label>
            <input
              type="tel"
              placeholder="+1 (555) 000-0000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-lg border border-stone-300 p-2.5 text-stone-900 focus:outline-none focus:border-stone-900"
            />
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full cursor-pointer rounded-full bg-stone-900 py-3 text-center text-xs font-semibold uppercase tracking-wider text-white shadow-sm hover:bg-stone-700 disabled:opacity-50 transition mt-2"
        >
          {loading
            ? "Processing…"
            : mode === "login"
              ? "Sign In to Studio Account"
              : "Register Account"}
        </button>

        <p className="text-[11px] text-center text-stone-400 pt-2">
          By continuing, you agree to Clay &amp; Co.&apos;s{" "}
          <Link href="/terms" className="underline hover:text-stone-700">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline hover:text-stone-700">
            Privacy Policy
          </Link>
          .
        </p>
      </form>
    </div>
  );
}
