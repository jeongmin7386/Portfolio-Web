"use client";

import {
  Copy,
  Download,
  FolderOpen,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Send,
  Trash2,
  Upload
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import type { StudioProjectSummary } from "@/lib/studio-projects";

type StudioProjectsManagerProps = {
  editBasePath: string;
};

type ProjectResponseRecord = StudioProjectSummary & {
  data?: unknown;
  publishedData?: unknown;
};

type ConflictState = {
  projectId: string;
  name: string;
  latestRevision: number;
  latestUpdatedAt: string;
};

const buttonClass =
  "inline-flex items-center justify-center gap-2 rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 transition hover:border-neutral-400 hover:text-neutral-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300 dark:hover:border-neutral-600 dark:hover:text-neutral-50";
const primaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-md border border-neutral-950 bg-neutral-950 px-3 py-2 text-sm font-medium text-white transition hover:bg-neutral-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-neutral-50 dark:bg-neutral-50 dark:text-neutral-950 dark:hover:bg-neutral-200";
const dangerButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-md border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 transition hover:border-red-300 hover:bg-red-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-900/70 dark:bg-neutral-950 dark:text-red-300 dark:hover:bg-red-950/30";
const inputClass =
  "w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-neutral-950 focus:ring-2 focus:ring-neutral-950/10 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-50 dark:focus:border-neutral-50";

function toSummary(project: ProjectResponseRecord): StudioProjectSummary {
  return {
    id: project.id,
    ownerKey: project.ownerKey,
    name: project.name,
    thumbnail: project.thumbnail,
    status: project.status,
    revision: project.revision,
    schemaVersion: project.schemaVersion,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    publishedAt: project.publishedAt
  };
}

function formatDate(value?: string) {
  if (!value) {
    return "아직 없음";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

async function readJsonResponse(response: Response) {
  return (await response.json().catch(() => ({}))) as {
    message?: string;
    latestRevision?: number;
    latestUpdatedAt?: string;
  };
}

export function StudioProjectsManager({
  editBasePath
}: StudioProjectsManagerProps) {
  const [projects, setProjects] = useState<StudioProjectSummary[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [newProjectName, setNewProjectName] = useState("새 포트폴리오");
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isWorking, setIsWorking] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [conflict, setConflict] = useState<ConflictState | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const projectsRef = useRef<StudioProjectSummary[]>([]);
  const isWorkingRef = useRef(false);
  const saveProjectRef = useRef<
    (project: StudioProjectSummary) => Promise<void>
  >(async () => undefined);

  const updateProjectList = (project: ProjectResponseRecord) => {
    const summary = toSummary(project);

    setProjects((currentProjects) => {
      const nextProjects = [
        summary,
        ...currentProjects.filter((item) => item.id !== summary.id)
      ];

      return nextProjects.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    });
    setSelectedProjectId(summary.id);
  };

  const loadProjects = async () => {
    try {
      setIsLoading(true);
      setStatus("프로젝트 목록을 불러오는 중입니다.");
      const response = await fetch("/api/admin/studio-projects", {
        cache: "no-store"
      });

      if (response.status === 401) {
        window.location.href = "/admin/login";
        return;
      }

      if (!response.ok) {
        const body = await readJsonResponse(response);
        throw new Error(body.message ?? "프로젝트 목록을 불러오지 못했습니다.");
      }

      const body = (await response.json()) as {
        projects: StudioProjectSummary[];
      };
      setProjects(body.projects);
      setSelectedProjectId((currentId) => currentId || body.projects[0]?.id || "");
      setStatus("프로젝트 목록을 불러왔습니다.");
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : "프로젝트 목록을 불러오지 못했습니다."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadProjects();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const createFromCurrent = async (name = newProjectName) => {
    try {
      setIsWorking(true);
      setStatus("현재 편집 상태를 새 프로젝트로 저장하는 중입니다.");
      const response = await fetch("/api/admin/studio-projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          action: "save-current",
          name
        })
      });

      if (!response.ok) {
        const body = await readJsonResponse(response);
        throw new Error(body.message ?? "새 프로젝트를 저장하지 못했습니다.");
      }

      const body = (await response.json()) as {
        project: ProjectResponseRecord;
      };
      updateProjectList(body.project);
      setStatus("새 프로젝트로 저장했습니다.");
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "새 프로젝트를 저장하지 못했습니다."
      );
    } finally {
      setIsWorking(false);
    }
  };

  const saveProject = async (project: StudioProjectSummary) => {
    try {
      setIsWorking(true);
      setConflict(null);
      setStatus("저장 중입니다.");
      const response = await fetch(
        `/api/admin/studio-projects/${project.id}/snapshot`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            expectedRevision: project.revision
          })
        }
      );

      if (response.status === 409) {
        const body = await readJsonResponse(response);
        setConflict({
          projectId: project.id,
          name: project.name,
          latestRevision: body.latestRevision ?? project.revision,
          latestUpdatedAt: body.latestUpdatedAt ?? project.updatedAt
        });
        setStatus("다른 곳에서 저장된 최신 버전이 있습니다.");
        return;
      }

      if (!response.ok) {
        const body = await readJsonResponse(response);
        throw new Error(body.message ?? "프로젝트를 저장하지 못했습니다.");
      }

      const body = (await response.json()) as {
        project: ProjectResponseRecord;
      };
      updateProjectList(body.project);
      setStatus("저장 완료.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "저장 실패.");
    } finally {
      setIsWorking(false);
    }
  };

  useEffect(() => {
    projectsRef.current = projects;
  }, [projects]);

  useEffect(() => {
    isWorkingRef.current = isWorking;
  }, [isWorking]);

  useEffect(() => {
    saveProjectRef.current = saveProject;
  });

  useEffect(() => {
    if (!autoSaveEnabled || !selectedProjectId) {
      return;
    }

    const timer = window.setInterval(() => {
      const project = projectsRef.current.find(
        (item) => item.id === selectedProjectId
      );

      if (!project || isWorkingRef.current) {
        return;
      }

      void saveProjectRef.current(project);
    }, 60000);

    return () => window.clearInterval(timer);
  }, [autoSaveEnabled, selectedProjectId]);

  const publishProject = async (project: StudioProjectSummary) => {
    try {
      setIsWorking(true);
      setConflict(null);
      setStatus("게시 스냅샷을 저장하는 중입니다.");
      const response = await fetch(
        `/api/admin/studio-projects/${project.id}/publish`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            expectedRevision: project.revision
          })
        }
      );

      if (response.status === 409) {
        const body = await readJsonResponse(response);
        setConflict({
          projectId: project.id,
          name: project.name,
          latestRevision: body.latestRevision ?? project.revision,
          latestUpdatedAt: body.latestUpdatedAt ?? project.updatedAt
        });
        setStatus("최신 저장본을 확인한 뒤 다시 게시해 주세요.");
        return;
      }

      if (!response.ok) {
        const body = await readJsonResponse(response);
        throw new Error(body.message ?? "게시 스냅샷을 저장하지 못했습니다.");
      }

      const body = (await response.json()) as {
        project: ProjectResponseRecord;
      };
      updateProjectList(body.project);
      setStatus("게시 스냅샷을 저장했습니다.");
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : "게시 스냅샷을 저장하지 못했습니다."
      );
    } finally {
      setIsWorking(false);
    }
  };

  const openProject = async (project: StudioProjectSummary) => {
    try {
      setIsWorking(true);
      setStatus("프로젝트를 편집 상태로 복원하는 중입니다.");
      const response = await fetch(
        `/api/admin/studio-projects/${project.id}/open`,
        {
          method: "POST"
        }
      );

      if (!response.ok) {
        const body = await readJsonResponse(response);
        throw new Error(body.message ?? "프로젝트를 열지 못했습니다.");
      }

      const body = (await response.json()) as {
        editPath?: string;
      };

      window.location.assign(body.editPath || editBasePath);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "프로젝트를 열지 못했습니다.");
      setIsWorking(false);
    }
  };

  const renameProject = async (project: StudioProjectSummary) => {
    const name = window.prompt("새 프로젝트 이름", project.name);

    if (!name || name.trim() === project.name) {
      return;
    }

    try {
      setIsWorking(true);
      setStatus("이름을 바꾸는 중입니다.");
      const response = await fetch(`/api/admin/studio-projects/${project.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ name })
      });

      if (!response.ok) {
        const body = await readJsonResponse(response);
        throw new Error(body.message ?? "이름을 바꾸지 못했습니다.");
      }

      const body = (await response.json()) as {
        project: ProjectResponseRecord;
      };
      updateProjectList(body.project);
      setStatus("이름을 바꿨습니다.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "이름을 바꾸지 못했습니다.");
    } finally {
      setIsWorking(false);
    }
  };

  const duplicateProject = async (project: StudioProjectSummary) => {
    try {
      setIsWorking(true);
      setStatus("프로젝트를 복제하는 중입니다.");
      const response = await fetch(
        `/api/admin/studio-projects/${project.id}/duplicate`,
        {
          method: "POST"
        }
      );

      if (!response.ok) {
        const body = await readJsonResponse(response);
        throw new Error(body.message ?? "프로젝트를 복제하지 못했습니다.");
      }

      const body = (await response.json()) as {
        project: ProjectResponseRecord;
      };
      updateProjectList(body.project);
      setStatus("프로젝트를 복제했습니다.");
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "프로젝트를 복제하지 못했습니다."
      );
    } finally {
      setIsWorking(false);
    }
  };

  const deleteProject = async (project: StudioProjectSummary) => {
    if (!window.confirm(`"${project.name}" 프로젝트를 삭제할까요?`)) {
      return;
    }

    try {
      setIsWorking(true);
      setStatus("프로젝트를 삭제하는 중입니다.");
      const response = await fetch(`/api/admin/studio-projects/${project.id}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        const body = await readJsonResponse(response);
        throw new Error(body.message ?? "프로젝트를 삭제하지 못했습니다.");
      }

      setProjects((currentProjects) =>
        currentProjects.filter((item) => item.id !== project.id)
      );
      setSelectedProjectId((currentId) =>
        currentId === project.id ? "" : currentId
      );
      setStatus("프로젝트를 삭제했습니다. 업로드 파일은 공유 가능성을 위해 유지됩니다.");
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "프로젝트를 삭제하지 못했습니다."
      );
    } finally {
      setIsWorking(false);
    }
  };

  const exportProject = async (project: StudioProjectSummary) => {
    try {
      setIsWorking(true);
      setStatus("내보내기 파일을 준비하는 중입니다.");
      const response = await fetch(
        `/api/admin/studio-projects/${project.id}/export`,
        {
          cache: "no-store"
        }
      );

      if (!response.ok) {
        const body = await readJsonResponse(response);
        throw new Error(body.message ?? "프로젝트를 내보내지 못했습니다.");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${project.name || "studio-project"}.studiofflower.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setStatus("내보내기 파일을 만들었습니다.");
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "프로젝트를 내보내지 못했습니다."
      );
    } finally {
      setIsWorking(false);
    }
  };

  const importProject = async (file: File) => {
    try {
      setIsWorking(true);
      setStatus("프로젝트 파일을 읽는 중입니다.");
      const text = await file.text();
      const parsed = JSON.parse(text) as unknown;
      const response = await fetch("/api/admin/studio-projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          action: "import",
          file: parsed,
          name: file.name.replace(/\.studiofflower\.json$/i, "")
        })
      });

      if (!response.ok) {
        const body = await readJsonResponse(response);
        throw new Error(body.message ?? "프로젝트를 가져오지 못했습니다.");
      }

      const body = (await response.json()) as {
        project: ProjectResponseRecord;
      };
      updateProjectList(body.project);
      setStatus("프로젝트를 가져왔습니다. 열기를 누르면 편집 상태로 복원됩니다.");
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : "프로젝트 파일을 가져오지 못했습니다."
      );
    } finally {
      setIsWorking(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-8 text-neutral-950 dark:text-neutral-50 sm:px-6 lg:px-8">
      <section className="rounded-lg border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">
              내 프로젝트
            </p>
            <h1 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">
              저장한 포트폴리오 작업
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-neutral-600 dark:text-neutral-300">
              편집 가능한 JSON 구조를 계정별로 저장합니다. 다른 탭이나 기기에서도
              같은 계정으로 로그인하면 마지막 저장 상태를 다시 불러올 수 있습니다.
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-[minmax(180px,260px)_auto_auto]">
            <input
              className={inputClass}
              onChange={(event) => setNewProjectName(event.target.value)}
              placeholder="프로젝트 이름"
              value={newProjectName}
            />
            <button
              className={primaryButtonClass}
              disabled={isWorking}
              onClick={() => void createFromCurrent()}
              type="button"
            >
              <Plus aria-hidden size={16} />
              현재 작업 저장
            </button>
            <button
              className={buttonClass}
              disabled={isWorking}
              onClick={() => fileInputRef.current?.click()}
              type="button"
            >
              <Upload aria-hidden size={16} />
              가져오기
            </button>
            <input
              accept=".studiofflower.json,application/json"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];

                if (file) {
                  void importProject(file);
                }
              }}
              ref={fileInputRef}
              type="file"
            />
            <label className="flex items-center gap-2 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 sm:col-span-3">
              <input
                checked={autoSaveEnabled}
                className="h-4 w-4 accent-neutral-950 dark:accent-neutral-50"
                onChange={(event) => setAutoSaveEnabled(event.target.checked)}
                type="checkbox"
              />
              자동 저장
              <span className="text-neutral-400">
                선택한 프로젝트를 60초마다 저장합니다.
              </span>
            </label>
          </div>
        </div>
      </section>

      {status ? (
        <p className="rounded-md border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300">
          {isWorking ? (
            <Loader2 aria-hidden className="mr-2 inline animate-spin" size={15} />
          ) : null}
          {status}
        </p>
      ) : null}

      {conflict ? (
        <section className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-100">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p>
              <strong>{conflict.name}</strong>에 더 최신 저장본이 있습니다.
              최신 수정 시각: {formatDate(conflict.latestUpdatedAt)}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                className={buttonClass}
                onClick={() => {
                  setConflict(null);
                  void loadProjects();
                }}
                type="button"
              >
                최신 버전 불러오기
              </button>
              <button
                className={primaryButtonClass}
                onClick={() => {
                  const name = `${conflict.name} 사본`;
                  setConflict(null);
                  void createFromCurrent(name);
                }}
                type="button"
              >
                사본으로 저장
              </button>
            </div>
          </div>
        </section>
      ) : null}

      <section className="grid gap-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold">프로젝트 목록</h2>
          <button
            className={buttonClass}
            disabled={isLoading}
            onClick={() => void loadProjects()}
            type="button"
          >
            <RefreshCw aria-hidden size={16} />
            새로고침
          </button>
        </div>

        {isLoading ? (
          <div className="rounded-lg border border-neutral-200 bg-white p-8 text-sm text-neutral-500 dark:border-neutral-800 dark:bg-neutral-950">
            <Loader2 aria-hidden className="mr-2 inline animate-spin" size={16} />
            프로젝트를 불러오는 중입니다.
          </div>
        ) : projects.length === 0 ? (
          <div className="rounded-lg border border-neutral-200 bg-white p-8 text-sm text-neutral-500 dark:border-neutral-800 dark:bg-neutral-950">
            저장된 프로젝트가 없습니다. 현재 작업을 먼저 저장해 주세요.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {projects.map((project) => {
              const active = project.id === selectedProjectId;

              return (
                <article
                  className={`overflow-hidden rounded-lg border bg-white transition dark:bg-neutral-950 ${
                    active
                      ? "border-neutral-950 shadow-sm dark:border-neutral-50"
                      : "border-neutral-200 hover:border-neutral-400 dark:border-neutral-800 dark:hover:border-neutral-600"
                  }`}
                  key={project.id}
                >
                  <button
                    className="block w-full text-left"
                    onClick={() => setSelectedProjectId(project.id)}
                    type="button"
                  >
                    <div className="aspect-[16/9] bg-neutral-100 dark:bg-neutral-900">
                      {project.thumbnail ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          alt=""
                          className="h-full w-full object-contain"
                          loading="lazy"
                          src={project.thumbnail}
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-neutral-400">
                          썸네일 없음
                        </div>
                      )}
                    </div>
                    <div className="grid gap-2 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="line-clamp-2 text-lg font-semibold">
                          {project.name}
                        </h3>
                        <span className="rounded-sm border border-neutral-200 px-2 py-1 text-xs text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
                          {project.status === "published" ? "게시됨" : "초안"}
                        </span>
                      </div>
                      <p className="text-xs leading-6 text-neutral-500 dark:text-neutral-400">
                        마지막 수정 {formatDate(project.updatedAt)}
                      </p>
                      <p className="text-xs leading-6 text-neutral-500 dark:text-neutral-400">
                        리비전 {project.revision}
                        {project.publishedAt
                          ? ` · 마지막 게시 ${formatDate(project.publishedAt)}`
                          : ""}
                      </p>
                    </div>
                  </button>
                  <div className="grid grid-cols-2 gap-2 border-t border-neutral-200 p-3 dark:border-neutral-800">
                    <button
                      className={primaryButtonClass}
                      disabled={isWorking}
                      onClick={() => void openProject(project)}
                      type="button"
                    >
                      <FolderOpen aria-hidden size={15} />
                      열기
                    </button>
                    <button
                      className={buttonClass}
                      disabled={isWorking}
                      onClick={() => void saveProject(project)}
                      type="button"
                    >
                      <Save aria-hidden size={15} />
                      저장
                    </button>
                    <button
                      className={buttonClass}
                      disabled={isWorking}
                      onClick={() => void publishProject(project)}
                      type="button"
                    >
                      <Send aria-hidden size={15} />
                      게시 기록
                    </button>
                    <button
                      className={buttonClass}
                      disabled={isWorking}
                      onClick={() => void renameProject(project)}
                      type="button"
                    >
                      <Pencil aria-hidden size={15} />
                      이름 변경
                    </button>
                    <button
                      className={buttonClass}
                      disabled={isWorking}
                      onClick={() => void duplicateProject(project)}
                      type="button"
                    >
                      <Copy aria-hidden size={15} />
                      복제
                    </button>
                    <button
                      className={buttonClass}
                      disabled={isWorking}
                      onClick={() => void exportProject(project)}
                      type="button"
                    >
                      <Download aria-hidden size={15} />
                      내보내기
                    </button>
                    <button
                      className={`${dangerButtonClass} col-span-2`}
                      disabled={isWorking}
                      onClick={() => void deleteProject(project)}
                      type="button"
                    >
                      <Trash2 aria-hidden size={15} />
                      삭제
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="rounded-lg border border-neutral-200 bg-white p-5 text-sm leading-7 text-neutral-600 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300">
        <h2 className="text-base font-semibold text-neutral-950 dark:text-neutral-50">
          저장되는 내용
        </h2>
        <p className="mt-3">
          페이지 구성, 블록 순서와 계층, 프로젝트·아카이브 콘텐츠, 텍스트,
          이미지 URL, 폰트, 색상, 여백, 반응형 설정, SEO와 게시 설정을 함께
          저장합니다. 내보내기 파일은 다시 가져와 편집할 수 있는
          <code className="mx-1 rounded bg-neutral-100 px-1 py-0.5 text-xs dark:bg-neutral-900">
            .studiofflower.json
          </code>
          형식입니다.
        </p>
      </section>
    </div>
  );
}
