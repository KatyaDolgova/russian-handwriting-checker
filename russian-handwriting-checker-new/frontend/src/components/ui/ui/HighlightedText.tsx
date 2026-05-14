import { useState } from 'react';
import type { CheckError } from '@/types';

interface Segment {
  text: string;
  error?: CheckError;
}

function buildSegments(text: string, errors: CheckError[]): Segment[] {
  const unique = errors.filter(
    (e, i, arr) => e.original && e.original.length >= 2 && arr.findIndex((x) => x.original === e.original) === i,
  );

  const segments: Segment[] = [{ text }];

  for (const error of unique) {
    const result: Segment[] = [];
    for (const seg of segments) {
      if (seg.error) {
        result.push(seg);
        continue;
      }
      const idx = seg.text.indexOf(error.original);
      if (idx === -1) {
        result.push(seg);
      } else {
        if (idx > 0) result.push({ text: seg.text.slice(0, idx) });
        result.push({ text: error.original, error });
        const after = seg.text.slice(idx + error.original.length);
        if (after) result.push({ text: after });
      }
    }
    segments.splice(0, segments.length, ...result);
  }

  return segments;
}

const ErrorSpan = ({ seg }: { seg: Segment }) => {
  const [show, setShow] = useState(false);

  const tooltip = [
    seg.error?.type,
    seg.error?.corrected && seg.error.corrected !== seg.error.original
      ? `→ ${seg.error.corrected}`
      : null,
    seg.error?.comment,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <span className="relative inline">
      <span
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        className="underline decoration-red-400 decoration-wavy text-red-700"
      >
        {seg.text}
      </span>
      {show && tooltip && (
        <span className="absolute bottom-full left-0 mb-1 z-50 w-64 whitespace-normal bg-slate-800 text-white text-xs rounded-lg px-2.5 py-1.5 shadow-lg pointer-events-none leading-snug">
          {tooltip}
        </span>
      )}
    </span>
  );
};

export const HighlightedText = ({
  text,
  errors,
  className,
}: {
  text: string;
  errors: CheckError[];
  className?: string;
}) => {
  const segments = buildSegments(text, errors);

  return (
    <div className={className}>
      {segments.map((seg, i) =>
        seg.error ? (
          <ErrorSpan key={i} seg={seg} />
        ) : (
          <span key={i}>{seg.text}</span>
        ),
      )}
    </div>
  );
};
