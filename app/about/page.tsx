import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Studio 낙화 시작하기",
  description:
    "로그인 후 나만의 소개와 포트폴리오 페이지를 편집합니다.",
  robots: {
    index: false,
    follow: false
  }
};

export default function AboutPage() {
  redirect("/");
}
