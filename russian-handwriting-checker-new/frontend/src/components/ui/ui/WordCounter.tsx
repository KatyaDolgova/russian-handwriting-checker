export const WordCounter = ({ text }: { text: string }) => {
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const chars = text.length;
  const color =
    words >= 150 ? 'text-emerald-500' : words >= 70 ? 'text-amber-500' : 'text-slate-400';
  return (
    <span className={`text-xs tabular-nums ${color}`}>
      {words} сл · {chars} симв
    </span>
  );
};
