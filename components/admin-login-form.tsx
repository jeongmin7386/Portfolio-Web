"use client";

import { Loader2, LockKeyhole, UserPlus } from "lucide-react";
import { useState } from "react";

const inputClass =
  "w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-950 transition placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-50 dark:focus:border-neutral-600";
const buttonClass =
  "inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-md border border-neutral-950 bg-neutral-950 px-3 py-2 text-sm font-medium text-white transition hover:bg-neutral-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-neutral-50 dark:bg-neutral-50 dark:text-neutral-950 dark:hover:bg-neutral-200";
const secondaryButtonClass =
  "inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-800 transition hover:border-neutral-400 hover:text-neutral-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-200 dark:hover:border-neutral-600 dark:hover:text-neutral-50";

type LoginMode = "account" | "owner" | "request";

type AdminLoginFormProps = {
  ownerPasswordConfigured: boolean;
};

export function AdminLoginForm({
  ownerPasswordConfigured
}: AdminLoginFormProps) {
  const [mode, setMode] = useState<LoginMode>("account");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isRequestMode = mode === "request";
  const isOwnerMode = mode === "owner";

  const resetFormMessage = (nextMode: LoginMode) => {
    setMode(nextMode);
    setStatus("");
    setPassword("");
  };

  const handleLogin = async () => {
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(
        isOwnerMode
          ? { ownerPassword: password }
          : { email: email.trim(), password }
      )
    });
    const body = (await response.json()) as {
      message?: string;
      redirectTo?: string;
    };

    if (!response.ok) {
      throw new Error(body.message ?? "로그인하지 못했습니다.");
    }

    window.location.href = body.redirectTo ?? "/admin";
  };

  const handleRequest = async () => {
    const response = await fetch("/api/admin/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: email.trim(),
        name: name.trim(),
        password
      })
    });
    const body = (await response.json()) as { message?: string };

    if (!response.ok) {
      throw new Error(body.message ?? "계정 신청을 접수하지 못했습니다.");
    }

    setName("");
    setPassword("");
    setStatus(
      body.message ??
        "계정 신청이 접수되었습니다. 소유자 승인 후 로그인할 수 있습니다."
    );
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus("");

    try {
      if (isRequestMode) {
        await handleRequest();
      } else {
        await handleLogin();
      }
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "요청을 처리하지 못했습니다."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      className="mx-auto grid w-full max-w-md gap-5 rounded-md border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-950"
      onSubmit={handleSubmit}
    >
      <div>
        <p className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-neutral-200 text-neutral-700 dark:border-neutral-800 dark:text-neutral-200">
          {isRequestMode ? (
            <UserPlus aria-hidden size={18} />
          ) : (
            <LockKeyhole aria-hidden size={18} />
          )}
        </p>
        <h1 className="mt-4 font-display text-3xl font-semibold text-neutral-950 dark:text-neutral-50">
          {isRequestMode ? "관리자 계정 신청" : "관리자 로그인"}
        </h1>
        <p className="mt-3 text-sm leading-6 text-neutral-600 dark:text-neutral-300">
          {isRequestMode
            ? "신청한 계정은 소유자 승인 후 사용할 수 있습니다."
            : "승인된 계정으로 로그인하거나 소유자 비밀번호를 사용하세요."}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <button
          aria-pressed={mode === "account"}
          className={mode === "account" ? buttonClass : secondaryButtonClass}
          onClick={() => resetFormMessage("account")}
          type="button"
        >
          계정
        </button>
        <button
          aria-pressed={mode === "owner"}
          className={mode === "owner" ? buttonClass : secondaryButtonClass}
          onClick={() => resetFormMessage("owner")}
          type="button"
        >
          소유자
        </button>
        <button
          aria-pressed={mode === "request"}
          className={mode === "request" ? buttonClass : secondaryButtonClass}
          onClick={() => resetFormMessage("request")}
          type="button"
        >
          신청
        </button>
      </div>

      {isRequestMode ? (
        <label className="grid gap-2 text-sm font-medium text-neutral-800 dark:text-neutral-200">
          이름
          <input
            autoComplete="name"
            className={inputClass}
            onChange={(event) => setName(event.target.value)}
            value={name}
          />
        </label>
      ) : null}

      {!isOwnerMode ? (
        <label className="grid gap-2 text-sm font-medium text-neutral-800 dark:text-neutral-200">
          이메일
          <input
            autoComplete="email"
            className={inputClass}
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            value={email}
          />
        </label>
      ) : null}

      <label className="grid gap-2 text-sm font-medium text-neutral-800 dark:text-neutral-200">
        {isOwnerMode ? "소유자 비밀번호" : "비밀번호"}
        <input
          autoComplete={isRequestMode ? "new-password" : "current-password"}
          autoFocus
          className={inputClass}
          onChange={(event) => setPassword(event.target.value)}
          type="password"
          value={password}
        />
      </label>

      {isOwnerMode && !ownerPasswordConfigured ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm leading-6 text-amber-900 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-100">
          소유자 비밀번호가 아직 설정되지 않았습니다. Render 환경변수에
          STUDIO_ARCHIVE_ADMIN_PASSWORD를 추가해주세요.
        </p>
      ) : null}

      {status ? (
        <p className="rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm leading-6 text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200">
          {status}
        </p>
      ) : null}

      <button
        className={buttonClass}
        disabled={isSubmitting || (isOwnerMode && !ownerPasswordConfigured)}
        type="submit"
      >
        {isSubmitting ? (
          <Loader2 aria-hidden className="animate-spin" size={16} />
        ) : isRequestMode ? (
          <UserPlus aria-hidden size={16} />
        ) : (
          <LockKeyhole aria-hidden size={16} />
        )}
        {isRequestMode ? "승인 요청 보내기" : "로그인"}
      </button>
    </form>
  );
}
