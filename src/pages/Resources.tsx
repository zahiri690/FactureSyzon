import { motion } from 'framer-motion';
import { BookOpen, FileSignature, GraduationCap, Link2, MoveRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Modal } from '../components/ui';
import { useData } from '../lib/store';
import type { Resource, ResourceKind } from '../types';
import { fmtDate } from '../lib/utils';

const KIND_META: Record<ResourceKind, { label: string; icon: typeof BookOpen; cls: string }> = {
  guide: { label: 'Guide', icon: GraduationCap, cls: 'bg-brand-50 text-brand-700' },
  fiche: { label: 'Fiche pratique', icon: BookOpen, cls: 'bg-blue-50 text-blue-700' },
  modele: { label: 'Modèle', icon: FileSignature, cls: 'bg-violet-50 text-violet-700' },
  lien: { label: 'Lien utile', icon: Link2, cls: 'bg-amber-50 text-amber-700' },
};

/** Rendu léger : titres "## ", listes "- ", encadrés "> ", sinon paragraphes. */
function RichContent({ content }: { content: string }) {
  const blocks = content.split(/\n{2,}/);
  return (
    <div className="space-y-4 text-[15px] leading-relaxed text-ink-700">
      {blocks.map((block, i) => {
        const trimmed = block.trim();
        if (trimmed.startsWith('## ')) {
          return (
            <h3 key={i} className="pt-2 text-base font-extrabold tracking-tight text-ink-900">
              {trimmed.slice(3)}
            </h3>
          );
        }
        if (trimmed.startsWith('> ')) {
          return (
            <div key={i} className="rounded-xl border-l-4 border-brand-500 bg-brand-50/60 px-4 py-3 text-sm font-medium text-brand-900">
              {trimmed.slice(2)}
            </div>
          );
        }
        if (trimmed.split('\n').every((l) => l.trim().startsWith('- '))) {
          return (
            <ul key={i} className="space-y-1.5">
              {trimmed.split('\n').map((l, j) => (
                <li key={j} className="flex gap-2.5">
                  <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                  <span>{l.trim().slice(2)}</span>
                </li>
              ))}
            </ul>
          );
        }
        return <p key={i}>{trimmed}</p>;
      })}
    </div>
  );
}

export default function Resources() {
  const { state } = useData();
  const [filter, setFilter] = useState<'tous' | ResourceKind>('tous');
  const [reading, setReading] = useState<Resource | null>(null);

  const resources = useMemo(
    () => state.resources.filter((r) => (filter === 'tous' ? true : r.kind === filter)),
    [state.resources, filter],
  );

  return (
    <div className="space-y-5">
      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink-900 sm:text-3xl">Ressources</h1>
        <p className="mt-1 text-sm text-ink-500">
          Guides, fiches et modèles pour facturer en toute conformité et vous faire payer plus vite.
        </p>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-1.5 rounded-xl border border-ink-200 bg-white p-1 sm:w-fit">
        <button
          onClick={() => setFilter('tous')}
          className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${filter === 'tous' ? 'bg-ink-950 text-white shadow' : 'text-ink-500 hover:bg-ink-50'}`}
        >
          Tous
        </button>
        {(Object.keys(KIND_META) as ResourceKind[]).map((k) => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${filter === k ? 'bg-ink-950 text-white shadow' : 'text-ink-500 hover:bg-ink-50'}`}
          >
            {KIND_META[k].label}s
          </button>
        ))}
      </div>

      {/* Grille */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {resources.map((r, i) => {
          const meta = KIND_META[r.kind];
          return (
            <motion.button
              key={r.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.05, 0.3), duration: 0.35 }}
              onClick={() => setReading(r)}
              className="group flex flex-col rounded-2xl border border-ink-100 bg-white p-6 text-left shadow-[0_1px_3px_rgba(16,24,40,0.05)] transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-lg"
            >
              <div className="flex items-center justify-between">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${meta.cls}`}>
                  <meta.icon size={13} />
                  {meta.label}
                </span>
                <span className="text-[11px] font-medium text-ink-300">{r.tag}</span>
              </div>
              <h2 className="mt-4 text-[17px] font-extrabold leading-snug tracking-tight text-ink-900 group-hover:text-brand-800">
                {r.title}
              </h2>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-500">{r.description}</p>
              <div className="mt-5 flex items-center justify-between border-t border-ink-50 pt-4">
                <span className="text-xs text-ink-300">MAJ {fmtDate(r.updatedAt)}</span>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-700 transition group-hover:gap-2.5">
                  Lire <MoveRight size={14} />
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Modale de lecture */}
      <Modal open={!!reading} onClose={() => setReading(null)} title={reading?.title ?? ''} wide>
        {reading && (
          <div>
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${KIND_META[reading.kind].cls}`}>
                {KIND_META[reading.kind].label}
              </span>
              <span className="rounded-full bg-ink-50 px-3 py-1 text-xs font-semibold text-ink-500">{reading.tag}</span>
              <span className="text-xs text-ink-300">Mis à jour le {fmtDate(reading.updatedAt)}</span>
            </div>
            <RichContent content={reading.content} />
          </div>
        )}
      </Modal>
    </div>
  );
}
