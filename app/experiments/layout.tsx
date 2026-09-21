import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import { MODEL_COLOR_VAR, MODEL_SHORT_LABEL } from "@/components/experiments/model-colors";
import { MODEL_KEYS, MODEL_LABELS } from "@/benchmarks/lib/models";

const TABS = [
  { href: "/experiments", label: "Overview" },
  { href: "/experiments/single-tool", label: "Single tool" },
  { href: "/experiments/multi-tool", label: "Multi tool" },
  { href: "/experiments/substitution", label: "Item substitution" },
] as const;

export default function ExperimentsLayout({ children }: { readonly children: React.ReactNode }) {
  return (
    <div className="mx-auto min-h-dvh max-w-5xl px-4 py-8 sm:px-6">
      <header className="mb-6 space-y-4">
        <Link
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          href="/"
        >
          <ArrowLeftIcon className="size-3.5" />
          Back to chat
        </Link>
        <div>
          <h1 className="text-2xl font-medium tracking-tight">Model Experiments</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            jev vs Claude Sonnet 5 vs Claude Opus 5 — tool-picking accuracy, latency, and a realistic
            item-substitution reasoning task, run against the harness&apos;s own tool catalog and simulated data.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4 border-y py-2 text-xs">
          {MODEL_KEYS.map((key) => (
            <span className="inline-flex items-center gap-1.5" key={key}>
              <span className="size-2.5 rounded-full" style={{ background: MODEL_COLOR_VAR[key] }} />
              <span className="text-foreground">{MODEL_SHORT_LABEL[key]}</span>
              <span className="text-muted-foreground">({MODEL_LABELS[key]})</span>
            </span>
          ))}
        </div>
        <nav className="flex flex-wrap gap-1">
          {TABS.map((tab) => (
            <Link
              className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              href={tab.href}
              key={tab.href}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      </header>
      <main>{children}</main>
    </div>
  );
}
