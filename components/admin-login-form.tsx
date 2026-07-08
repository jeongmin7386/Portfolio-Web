"use client";

import { Loader2, LockKeyhole } from "lucide-react";
import { useState } from "react";

const inputClass =
  "w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-950 transition placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-50 dark:focus:border-neutral-600";
const buttonClass =
  "inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-md border border-neutral-950 bg-neutral-950 px-3 py-2 text-sm font-medium text-white transition hover:bg-neutral-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-neutral-50 dark:bg-neutral-50 dark:text-neutral-950 dark:hover:bg-neutral-200";

export function AdminLoginForm() {
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus("");

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ password })
      });
      const body = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(body.message ?? "로그인하지 못했습니다.");
      }

      window.location.href = "/admin";
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "로그인하지 못했습니다."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      className="mx-auto grid w-full max-w-sm gap-5 rounded-md border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-950"
      onSubmit={handleSubmit}
    >
      <div>
        <p className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-neutral-200 text-neutral-700 dark:border-neutral-800 dark:text-neutral-200">
          <LockKeyhole aria-hidden size={18} />
        </p>
        <h1 className="mt-4 font-display text-3xl font-semibold text-neutral-950 dark:text-neutral-50">
          관리자 로그인
        </h1>
        <p className="mt-3 text-sm leading-6 text-neutral-600 dark:text-neutral-300">
          Studio Archive 콘텐츠를 수정하려면 관리자 비밀번호가 필요합니다.
        </p>
      </div>
      <label className="grid gap-2 text-sm font-medium text-neutral-800 dark:text-neutral-200">
        비밀번호
        <input
          autoComplete="current-password"
          autoFocus
          className={inputClass}
          onChange={(event) => setPassword(event.target.value)}
          type="password"
          value={password}
        />
      </label>
      {status ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-950 dark:bg-red-950/20 dark:text-red-200">
          {status}
        </p>
      ) : null}
      <button className={buttonClass} disabled={isSubmitting} type="submit">
        {isSubmitting ? (
          <Loader2 aria-hidden className="animate-spin" size={16} />
        ) : (
          <LockKeyhole aria-hidden size={16} />
        )}
        로그인
      </button>
    </form>
  );
}
