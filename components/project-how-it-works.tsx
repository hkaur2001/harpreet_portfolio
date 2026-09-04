type ToolGroup = {
  label: string;
  items: string[];
};

export function ProjectHowItWorks({
  steps,
  toolGroups,
  note,
}: {
  steps: Array<{ title: string; body: string }>;
  toolGroups: ToolGroup[];
  note?: string;
}) {
  return (
    <details className="group mt-7 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--bg)]">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-sm font-semibold marker:content-none">
        <span>How does it work?</span>
        <span aria-hidden="true" className="text-lg transition-transform group-open:rotate-45">+</span>
      </summary>
      <div className="border-t border-[var(--line)] px-5 py-5">
        <div className="grid gap-3 md:grid-cols-2">
          {steps.map((step, index) => (
            <div key={step.title} className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4">
              <div className="flex gap-3">
                <span className="font-mono text-[11px] text-[var(--signal)]">{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <p className="text-sm font-semibold">{step.title}</p>
                  <p className="mt-1 text-xs leading-5 text-[var(--muted)]">{step.body}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {toolGroups.map((group) => (
            <div key={group.label} className="rounded-xl bg-[var(--soft)] p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">{group.label}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {group.items.map((item) => <span key={item} className="rounded-full bg-[var(--surface)] px-2.5 py-1 text-[11px]">{item}</span>)}
              </div>
            </div>
          ))}
        </div>

        {note && <p className="mt-5 text-xs leading-5 text-[var(--muted)]">{note}</p>}
      </div>
    </details>
  );
}
