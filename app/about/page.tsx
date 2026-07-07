import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";

import { SectionTitle } from "@/components/section-title";
import { TagList } from "@/components/tag-list";

export const metadata: Metadata = {
  title: "About",
  description:
    "About Studio Archive, experience, tools, contact, and social links."
};

const career = [
  {
    period: "2024 - Present",
    title: "Independent Designer",
    description:
      "Building identity systems, product interfaces, and editorial case studies for culture and technology teams."
  },
  {
    period: "2021 - 2024",
    title: "Senior Visual Designer",
    description:
      "Led brand refreshes, design systems, and campaign art direction across digital touchpoints."
  },
  {
    period: "2018 - 2021",
    title: "Editorial Designer",
    description:
      "Designed publications, image systems, and exhibition graphics for creative studios."
  }
];

const tools = [
  "Figma",
  "Framer",
  "Illustrator",
  "Photoshop",
  "InDesign",
  "After Effects",
  "Notion",
  "Webflow"
];

const socialLinks = [
  { label: "Email", href: "mailto:hello@studioarchive.example" },
  { label: "Instagram", href: "https://instagram.com" },
  { label: "Behance", href: "https://behance.net" },
  { label: "LinkedIn", href: "https://linkedin.com" }
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <section className="grid gap-10 pb-16 pt-8 md:grid-cols-[0.8fr_1.2fr] md:items-start">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">
            About
          </p>
          <h1 className="mt-5 font-display text-5xl font-semibold text-neutral-950 dark:text-neutral-50 md:text-7xl">
            Design work with a calm editorial spine.
          </h1>
        </div>
        <div className="grid gap-6 text-base leading-8 text-neutral-600 dark:text-neutral-300">
          <p>
            Studio Archive is a portfolio framework for presenting visual work
            with the flexibility of a personal knowledge base. It is built for
            case studies, research fragments, launch notes, and image systems.
          </p>
          <p>
            The current practice moves between brand identity, UI/UX, editorial
            direction, and motion-led storytelling.
          </p>
        </div>
      </section>

      <section className="pb-16">
        <SectionTitle eyebrow="Experience" title="Career" />
        <div className="divide-y divide-neutral-200 border-y border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
          {career.map((item) => (
            <article
              className="grid gap-4 py-6 md:grid-cols-[180px_1fr]"
              key={item.title}
            >
              <p className="text-sm text-neutral-500 dark:text-neutral-500">
                {item.period}
              </p>
              <div>
                <h2 className="text-xl font-semibold text-neutral-950 dark:text-neutral-50">
                  {item.title}
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-neutral-600 dark:text-neutral-400">
                  {item.description}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-12 pb-16 md:grid-cols-2">
        <div>
          <SectionTitle eyebrow="Tools" title="Working Stack" />
          <TagList tags={tools} />
        </div>
        <div>
          <SectionTitle eyebrow="Contact" title="Links" />
          <div className="grid gap-3">
            {socialLinks.map((link) => (
              <a
                className="inline-flex items-center justify-between rounded-md border border-neutral-200 bg-white px-4 py-3 text-sm font-medium text-neutral-800 transition hover:border-neutral-400 hover:text-neutral-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-200 dark:hover:border-neutral-600 dark:hover:text-neutral-50"
                href={link.href}
                key={link.label}
              >
                {link.label}
                <ArrowUpRight aria-hidden size={16} />
              </a>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
