import { useState } from 'react';

type Props = {
  url: string | null | undefined;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  rounded?: 'full' | 'xl' | '2xl';
};

const SIZES: Record<string, string> = {
  xs: 'h-8 w-8 text-sm',
  sm: 'h-9 w-9 text-sm',
  md: 'h-10 w-10 text-base',
  lg: 'h-12 w-12 text-lg',
  xl: 'h-20 w-20 text-2xl',
};

const ROUNDED: Record<string, string> = {
  full: 'rounded-full',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
};

export default function Avatar({ url, name, size = 'md', className = '', rounded = 'full' }: Props) {
  const [failed, setFailed] = useState(false);
  const initial = (name?.[0] ?? '?').toUpperCase();

  if (url && !failed) {
    return (
      <div
        className={`flex shrink-0 items-center justify-center overflow-hidden bg-gradient-to-br from-spark-500/40 to-rose-500/30 font-display font-bold uppercase text-white ${SIZES[size]} ${ROUNDED[rounded]} ${className}`}
      >
        <img
          src={url}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      </div>
    );
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden bg-gradient-to-br from-spark-500/40 to-rose-500/30 font-display font-bold uppercase text-white ${SIZES[size]} ${ROUNDED[rounded]} ${className}`}
    >
      {initial}
    </div>
  );
}
