"use client";

export const dynamic = "force-dynamic";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    setLoading(false);
    if (res.ok) {
      const from = searchParams.get("from") ?? "/admin";
      router.push(from);
    } else {
      setError("Incorrect password.");
      setPassword("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="admin-password"
          className="mb-1 block text-sm font-medium text-stone-700"
        >
          Password
        </label>
        <input
          id="admin-password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-stone-300 bg-white px-4 py-2 text-[#14262B] focus:border-stone-600 focus:outline-none"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-stone-900 py-3 text-sm font-semibold text-white hover:bg-stone-700 disabled:opacity-50 transition"
      >
        {loading ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

export default function AdminLoginPage() {
  return (
    <main className="min-h-screen bg-[#E4E8E3] flex items-center justify-center">
      <div className="w-full max-w-sm rounded-2xl bg-[#F6F4EE] p-8 shadow-lg">
        <h1 className="mb-6 text-2xl font-bold text-[#14262B]">Admin Login</h1>
        <Suspense fallback={<p className="text-stone-500 text-sm">Loading…</p>}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
