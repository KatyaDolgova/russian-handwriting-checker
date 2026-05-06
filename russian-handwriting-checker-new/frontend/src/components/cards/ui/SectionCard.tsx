interface SectionCardProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

export const SectionCard = ({ title, icon, children }: SectionCardProps) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6">
      <h2 className="flex items-center gap-2 text-base font-semibold text-slate-800 mb-5">
        {icon}
        {title}
      </h2>
      {children}
    </div>
  );
};
