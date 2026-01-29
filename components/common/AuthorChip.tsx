'use client';

import Link from 'next/link';

interface AuthorChipProps {
  userId: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  size?: 'sm' | 'md' | 'lg';
  showAvatar?: boolean;
  className?: string;
}

export function AuthorChip({
  userId,
  username,
  displayName,
  avatarUrl,
  size = 'sm',
  showAvatar = true,
  className = ''
}: AuthorChipProps) {
  const name = displayName || 'Anonymous';
  const profileUrl = username ? `/u/${username}` : `/profile/${userId}`;
  
  const sizeClasses = {
    sm: 'text-xs gap-1',
    md: 'text-sm gap-1.5',
    lg: 'text-base gap-2'
  };
  
  const avatarSizes = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <Link
      href={profileUrl}
      className={`inline-flex items-center ${sizeClasses[size]} text-gray-700 hover:text-blue-600 transition-colors ${className}`}
    >
      {showAvatar && (
        <div className={`${avatarSizes[size]} rounded-full overflow-hidden bg-gray-200 flex items-center justify-center flex-shrink-0`}>
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={name}
              className="w-full h-full object-cover"
            />
          ) : (
            <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          )}
        </div>
      )}
      <span className="font-medium truncate">
        {name}
      </span>
      {username && (
        <span className="text-gray-500 truncate">
          @{username}
        </span>
      )}
    </Link>
  );
}
