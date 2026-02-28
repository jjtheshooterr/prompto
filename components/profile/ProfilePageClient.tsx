'use client';

import { useState } from 'react';
import { UserPromptsList } from './UserPromptsList';
import { UserForksList } from './UserForksList';
import { UserProblemsList } from './UserProblemsList';

type Tab = 'prompts' | 'forks' | 'problems';

interface Profile {
  id: string;
  username: string | null;
  display_name: string;
  avatar_url: string | null;
  created_at: string;
  reputation: number;
  upvotes_received: number;
  forks_received: number;
}

export function ProfilePageClient({ profile }: { profile: Profile }) {
  const [tab, setTab] = useState<Tab>('prompts');
  
  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-start gap-6 mb-8">
        {profile.avatar_url ? (
          <img 
            src={profile.avatar_url} 
            alt={profile.display_name}
            className="w-24 h-24 rounded-full border-2 border-gray-200"
          />
        ) : (
          <div className="w-24 h-24 rounded-full border-2 border-gray-200 bg-gray-100 flex items-center justify-center text-3xl font-bold text-gray-400">
            {profile.display_name.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{profile.display_name}</h1>
          {profile.username && (
            <p className="text-gray-600 text-lg">@{profile.username}</p>
          )}
          <p className="text-sm text-gray-500 mt-2">
            Member since {new Date(profile.created_at).toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric'
            })}
          </p>
          
          {/* Stats */}
          <div className="flex gap-6 mt-4">
            <StatPill 
              label="Reputation" 
              value={profile.reputation} 
              iconType="reputation"
            />
            <StatPill 
              label="Upvotes" 
              value={profile.upvotes_received} 
              iconType="upvotes"
            />
            <StatPill 
              label="Forks" 
              value={profile.forks_received} 
              iconType="forks"
            />
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-8">
          <TabButton 
            active={tab === 'prompts'} 
            onClick={() => setTab('prompts')}
          >
            Prompts
          </TabButton>
          <TabButton 
            active={tab === 'forks'} 
            onClick={() => setTab('forks')}
          >
            Forks
          </TabButton>
          <TabButton 
            active={tab === 'problems'} 
            onClick={() => setTab('problems')}
          >
            Problems
          </TabButton>
        </nav>
      </div>
      
      {/* Content */}
      <div className="min-h-[400px]">
        {tab === 'prompts' && <UserPromptsList userId={profile.id} />}
        {tab === 'forks' && <UserForksList userId={profile.id} />}
        {tab === 'problems' && <UserProblemsList userId={profile.id} />}
      </div>
    </div>
  );
}

function StatPill({ label, value, iconType }: { label: string; value: number; iconType: 'reputation' | 'upvotes' | 'forks' }) {
  const getIcon = () => {
    switch (iconType) {
      case 'reputation':
        return (
          <svg className="w-8 h-8 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        );
      case 'upvotes':
        return (
          <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
          </svg>
        );
      case 'forks':
        return (
          <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
          </svg>
        );
    }
  };

  return (
    <div className="flex items-center gap-2">
      {getIcon()}
      <div>
        <div className="text-2xl font-bold">{value.toLocaleString()}</div>
        <div className="text-sm text-gray-600">{label}</div>
      </div>
    </div>
  );
}

function TabButton({ 
  active, 
  onClick, 
  children 
}: { 
  active: boolean; 
  onClick: () => void; 
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        pb-3 px-1 border-b-2 font-medium transition-colors
        ${active 
          ? 'border-blue-600 text-blue-600' 
          : 'border-transparent text-gray-600 hover:text-gray-900'
        }
      `}
    >
      {children}
    </button>
  );
}
