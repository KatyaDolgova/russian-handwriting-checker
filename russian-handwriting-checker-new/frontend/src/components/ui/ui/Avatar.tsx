interface AvatarProps {
  name?: string | null;
  email?: string;
  size?: 'sm' | 'lg';
}

export const Avatar = ({ name, email, size = 'lg' }: AvatarProps) => {
  const letter = (name?.[0] || email?.[0] || '?').toUpperCase();
  const cls = size === 'lg' ? 'w-16 h-16 text-2xl' : 'w-10 h-10 text-base';
  return (
    <div
      className={`${cls} rounded-full bg-indigo-600 text-white flex items-center justify-center font-semibold select-none`}
    >
      {letter}
    </div>
  );
};
