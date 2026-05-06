interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  wide?: boolean;
}

export const StatCard = ({ icon, label, value, wide = false }: StatCardProps) => {
  return (
    <div className={`bg-white rounded-2xl border border-slate-100 p-4 ${wide ? 'col-span-2' : ''}`}>
      <div className="flex items-center gap-2 mb-2 text-slate-400">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
    </div>
  );
};
