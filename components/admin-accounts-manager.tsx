"use client";

import Link from "next/link";
import { Check, Loader2, RefreshCw, ShieldCheck, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import type { AdminUserStatus, PublicAdminUser } from "@/lib/admin-users";

const buttonClass =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-800 transition hover:border-neutral-400 hover:text-neutral-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-200 dark:hover:border-neutral-600 dark:hover:text-neutral-50";
const primaryButtonClass =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-neutral-950 bg-neutral-950 px-3 py-2 text-sm font-medium text-white transition hover:bg-neutral-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-neutral-50 dark:bg-neutral-50 dark:text-neutral-950 dark:hover:bg-neutral-200";
const dangerButtonClass =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-700 transition hover:border-red-300 hover:text-red-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-950 dark:bg-neutral-950 dark:text-red-300 dark:hover:border-red-800";

const statusCopy: Record<AdminUserStatus, string> = {
  approved: "승인됨",
  pending: "승인 대기",
  rejected: "거절됨"
};

const statusClass: Record<AdminUserStatus, string> = {
  approved:
    "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-200",
  pending:
    "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-100",
  rejected:
    "border-neutral-200 bg-neutral-100 text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400"
};

export function AdminAccountsManager() {
  const [users, setUsers] = useState<PublicAdminUser[]>([]);
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState("");

  const pendingCount = useMemo(
    () => users.filter((user) => user.status === "pending").length,
    [users]
  );

  const loadUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/admin/accounts", {
        cache: "no-store"
      });
      const body = (await response.json()) as {
        message?: string;
        users?: PublicAdminUser[];
      };

      if (response.status === 401) {
        window.location.href = "/admin/login";
        return;
      }

      if (!response.ok || !body.users) {
        throw new Error(body.message ?? "계정 목록을 불러오지 못했습니다.");
      }

      setUsers(body.users);
      setStatus("계정 목록을 불러왔습니다.");
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "계정 목록을 불러오지 못했습니다."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateStatus = async (id: string, nextStatus: AdminUserStatus) => {
    try {
      setUpdatingUserId(id);
      const response = await fetch(`/api/admin/accounts/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status: nextStatus })
      });
      const body = (await response.json()) as {
        message?: string;
        user?: PublicAdminUser;
      };

      if (!response.ok || !body.user) {
        throw new Error(body.message ?? "계정 상태를 변경하지 못했습니다.");
      }

      setUsers((currentUsers) =>
        currentUsers.map((user) => (user.id === id ? body.user! : user))
      );
      setStatus(
        nextStatus === "approved"
          ? "계정을 승인했습니다."
          : "계정 신청을 거절했습니다."
      );
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "계정 상태를 변경하지 못했습니다."
      );
    } finally {
      setUpdatingUserId("");
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadUsers();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadUsers]);

  return (
    <div className="mx-auto grid max-w-6xl gap-4 sm:gap-5">
      <header className="grid gap-5 rounded-md border border-neutral-200 bg-white/95 p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-950/95 sm:p-5 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">
            Accounts
          </p>
          <h1 className="mt-3 font-display text-3xl font-semibold text-neutral-950 dark:text-neutral-50 sm:text-4xl">
            관리자 승인
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-neutral-600 dark:text-neutral-300">
            다른 사람이 관리자 기능을 쓰려면 이곳에서 승인해야 합니다. 승인된
            계정만 로그인할 수 있습니다.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap lg:justify-end">
          <Link className={buttonClass} href="/admin">
            전체 관리
          </Link>
          <Link className={buttonClass} href="/admin/editor">
            홈 빌더
          </Link>
          <button
            className={`${primaryButtonClass} col-span-2 sm:col-span-1`}
            disabled={isLoading}
            onClick={() => void loadUsers()}
            type="button"
          >
            {isLoading ? (
              <Loader2 aria-hidden className="animate-spin" size={16} />
            ) : (
              <RefreshCw aria-hidden size={16} />
            )}
            새로고침
          </button>
        </div>
      </header>

      <section className="grid gap-3 rounded-md border border-neutral-200 bg-white/95 p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-950/95 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-neutral-950 dark:text-neutral-50">
              승인 대기 {pendingCount}명
            </h2>
            <p className="mt-1 text-sm leading-6 text-neutral-500 dark:text-neutral-400">
              신청자는 승인 전까지 관리자 화면에 들어올 수 없습니다.
            </p>
          </div>
          <ShieldCheck
            aria-hidden
            className="text-emerald-700 dark:text-emerald-300"
            size={24}
          />
        </div>
        {status ? (
          <p className="rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300">
            {status}
          </p>
        ) : null}
      </section>

      <section className="overflow-hidden rounded-md border border-neutral-200 bg-white/95 shadow-sm dark:border-neutral-800 dark:bg-neutral-950/95">
        {isLoading ? (
          <div className="flex min-h-48 items-center justify-center gap-3 text-sm text-neutral-500">
            <Loader2 aria-hidden className="animate-spin" size={18} />
            계정 목록을 불러오는 중입니다.
          </div>
        ) : users.length ? (
          <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {users.map((user) => {
              const isUpdating = updatingUserId === user.id;

              return (
                <article
                  className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[1fr_auto] lg:items-center"
                  key={user.id}
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-neutral-950 dark:text-neutral-50">
                        {user.name}
                      </h3>
                      <span
                        className={`rounded-sm border px-2 py-1 text-xs font-medium ${
                          statusClass[user.status]
                        }`}
                      >
                        {statusCopy[user.status]}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
                      {user.email}
                    </p>
                    <p className="mt-2 text-xs text-neutral-500">
                      신청일 {new Date(user.requestedAt).toLocaleDateString("ko-KR")}
                      {user.approvedAt
                        ? ` · 승인일 ${new Date(user.approvedAt).toLocaleDateString("ko-KR")}`
                        : ""}
                    </p>
                    {user.status === "approved" ? (
                      <Link
                        className="mt-3 inline-flex text-sm font-medium text-emerald-700 underline-offset-4 hover:underline dark:text-emerald-300"
                        href={`/u/${user.id}`}
                      >
                        공개 페이지 보기
                      </Link>
                    ) : null}
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end">
                    <button
                      className={primaryButtonClass}
                      disabled={isUpdating || user.status === "approved"}
                      onClick={() => void updateStatus(user.id, "approved")}
                      type="button"
                    >
                      {isUpdating ? (
                        <Loader2
                          aria-hidden
                          className="animate-spin"
                          size={16}
                        />
                      ) : (
                        <Check aria-hidden size={16} />
                      )}
                      승인
                    </button>
                    <button
                      className={dangerButtonClass}
                      disabled={isUpdating || user.status === "rejected"}
                      onClick={() => void updateStatus(user.id, "rejected")}
                      type="button"
                    >
                      <X aria-hidden size={16} />
                      거절
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="grid min-h-48 place-items-center p-6 text-center">
            <div>
              <h2 className="text-lg font-semibold text-neutral-950 dark:text-neutral-50">
                아직 신청된 계정이 없습니다.
              </h2>
              <p className="mt-2 text-sm leading-6 text-neutral-500 dark:text-neutral-400">
                새 사용자는 로그인 화면의 신청 탭에서 계정을 요청할 수 있습니다.
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
