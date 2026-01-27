import Link from 'next/link';
import Image from 'next/image';

interface AuthorChipProps {
  userId: string;
  username?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  size?: 'sm' | 'md';
  showAvatar?: boolean;
}

export function AuthorChip({ 
  userId, 
  username, 
  displayName, 
  avatarUrl,
  size = 'sm',
  showAvatar = true
}: AuthorChipProps) {
  const href = username ? `/u/${username}` : `/profile/${userId}`;
  const name = displayName || username || 'Anonymous';
  
  return (
    <Link 
      href={href} 
      className="inline-flex items-center gap-2 hover:underline text-gray-700 hover:text-gray-900 transition-colors"
    >
      {showAvatar && avatarUrl && (
        <Image 
          src={avatarUrl} 
          alt={name}
          width={size === 'sm' ? 24 : 32}
          height={size === 'sm' ? 24 : 32}
          className="rounded-full"
        />
      )}
      <span className={size === 'sm' ? 'text-sm' : 'text-base'}>
        {name}
      </span>
    </Link>
  );
}
