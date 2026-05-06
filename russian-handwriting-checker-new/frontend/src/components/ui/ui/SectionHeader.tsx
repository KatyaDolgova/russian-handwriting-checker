interface SectionHeaderProps {
  title: string;
  count: number;
  children?: React.ReactNode;
}

export const SectionHeader = ({ title, count, children }: SectionHeaderProps) => {
  return (
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-2">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">{title}</h3>
        <span className="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">
          {count}
        </span>
      </div>
      {children}
    </div>
  );
};
