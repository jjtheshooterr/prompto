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
              icon="⭐"
            />
            <StatPill 
              label="Upvotes" 
              value={profile.upvotes_received} 
              icon="👍"
            />
            <StatPill 
              label="Forks" 
              value={profile.forks_received} 
              icon="🔱"
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

function StatPill({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-2xl">{icon}</span>
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
