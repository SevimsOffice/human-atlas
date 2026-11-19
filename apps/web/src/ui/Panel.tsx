import type { ReactNode } from 'react';

export function Panel({ title, children, id }: { title: string; children: ReactNode; id?: string }) {
  return (
    <section aria-labelledby={id} className="border-b border-line px-3 py-2.5 last:border-b-0">
      <h2 id={id} className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.1em] text-graphite-soft">{title}</h2>
      {children}
    </section>
  );
}

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'warn' }) {
  const cls = tone === 'warn' ? 'border-amber-700/30 bg-amber-50 text-amber-900' : 'border-line bg-white text-graphite-soft';
  return <span className={`inline-block rounded-sm border px-1.5 py-px text-[10px] leading-4 ${cls}`}>{children}</span>;
}
