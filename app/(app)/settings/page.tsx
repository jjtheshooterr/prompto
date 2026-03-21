'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import Image from 'next/image';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [bio, setBio] = useState('');
  const [headline, setHeadline] = useState('');
  const [location, setLocation] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [originalUsername, setOriginalUsername] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      setUser(user);

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile) {
        setProfile(profile);
        setDisplayName(profile.display_name || '');
        setUsername(profile.username || '');
        setOriginalUsername(profile.username || '');
        setAvatarUrl(profile.avatar_url || null);
        setBio(profile.bio || '');
        setHeadline(profile.headline || '');
        setLocation(profile.location || '');
        setWebsiteUrl(profile.website_url || '');
      }
    }

    setLoading(false);
  };

  const checkUsername = async (value: string) => {
    if (!value || value.length < 3) {
      setUsernameAvailable(null);
      return;
    }

    // If it's the same as original, it's available
    if (value === originalUsername) {
      setUsernameAvailable(true);
      return;
    }

    // Validate format
    if (!/^[a-z0-9_]{3,20}$/.test(value)) {
      setUsernameAvailable(false);
      return;
    }

    setCheckingUsername(true);
    const supabase = createClient();
    const { data } = await supabase.rpc('is_username_available', { u: value });
    setUsernameAvailable(data);
    setCheckingUsername(false);
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase();
    setUsername(value);

    // Debounce the check
    const timeoutId = setTimeout(() => checkUsername(value), 500);
    return () => clearTimeout(timeoutId);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a valid image file (JPEG, PNG, GIF, or WebP)');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setUploading(true);
    const supabase = createClient();

    try {
      // Delete old avatar if exists
      if (avatarUrl) {
        const oldPath = avatarUrl.split('/').slice(-2).join('/');
        await supabase.storage.from('avatars').remove([oldPath]);
      }

      // Upload new avatar with timestamp to prevent caching
      const fileExt = file.name.split('.').pop();
      const timestamp = Date.now();
      const fileName = `${user.id}/avatar-${timestamp}.${fileExt}`;

      const { error: uploadError, data } = await supabase.storage
        .from('avatars')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update profile with new avatar URL using secure RPC
      const { error: updateError } = await supabase.rpc('update_profile', {
        p_avatar_url: publicUrl
      });

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      toast.success('Avatar updated successfully!');
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to upload avatar');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!user || !avatarUrl) return;

    setUploading(true);
    const supabase = createClient();

    try {
      // Delete from storage
      const oldPath = avatarUrl.split('/').slice(-2).join('/');
      await supabase.storage.from('avatars').remove([oldPath]);

      // Update profile using secure RPC
      const { error } = await supabase.rpc('update_profile', {
        p_avatar_url: null
      });

      if (error) throw error;

      setAvatarUrl(null);
      toast.success('Avatar removed successfully!');
    } catch (error: any) {
      console.error('Error removing avatar:', error);
      toast.error('Failed to remove avatar');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    // Validate username if provided and changed
    if (username && username !== originalUsername && usernameAvailable !== true) {
      toast.error('Please choose an available username');
      return;
    }

    setSaving(true);
    const supabase = createClient();

    try {
      // Update profile fields using secure RPC
      const { data, error: profileError } = await supabase.rpc('update_profile', {
        p_display_name: displayName || null,
        p_bio: bio || null,
        p_headline: headline || null,
        p_location: location || null,
        p_website_url: websiteUrl || null
      });

      if (profileError) {
        console.error('Profile update error:', profileError);
        console.error('Error details:', JSON.stringify(profileError, null, 2));
        throw profileError;
      }

      console.log('Profile updated successfully:', data);

      // Update username separately if changed
      if (username && username !== originalUsername) {
        const { error: usernameError } = await supabase.rpc('change_username', {
          p_new_username: username
        });

        if (usernameError) {
          if (usernameError.message.includes('30 days')) {
            toast.error('Username can only be changed once every 30 days');
          } else if (usernameError.message.includes('not available')) {
            toast.error('Username not available');
          } else if (usernameError.message.includes('Invalid username format')) {
            toast.error('Invalid username format. Use 3-20 lowercase letters, numbers, and underscores only.');
          } else {
            throw usernameError;
          }
          setSaving(false);
          return;
        }
      }

      toast.success('Profile updated! Refreshing page to show changes...');
      setOriginalUsername(username);

      // Force a page refresh after a short delay to clear all caches
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Profile Settings</h1>

      <div className="bg-card rounded-lg border border-border p-6 space-y-6">
        {/* Avatar Upload */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Profile Picture
          </label>
          <div className="flex items-center gap-4">
            <div className="relative w-24 h-24 rounded-full overflow-hidden bg-muted border-2 border-border">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt="Profile picture"
                  fill
                  sizes="96px"
                  priority
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                onChange={handleAvatarUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
              >
                {uploading ? 'Uploading...' : 'Upload Photo'}
              </button>
              {avatarUrl && (
                <button
                  onClick={handleRemoveAvatar}
                  disabled={uploading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                >
                  Remove Photo
                </button>
              )}
              <p className="text-xs text-muted-foreground">
                JPG, PNG, GIF or WebP. Max 5MB.
              </p>
            </div>
          </div>
        </div>

        {/* Email (read-only) */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Email
          </label>
          <input
            type="email"
            value={user?.email || ''}
            disabled
            className="w-full px-3 py-2 border border-border rounded-lg bg-muted text-muted-foreground cursor-not-allowed"
          />
          <p className="mt-1 text-xs text-muted-foreground">Email cannot be changed</p>
        </div>

        {/* Display Name */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Display Name
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your name"
            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            This is how your name will appear on your profile and posts
          </p>
        </div>

        {/* Username */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Username
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
            <input
              type="text"
              value={username}
              onChange={handleUsernameChange}
              placeholder="username"
              pattern="[a-z0-9_]{3,20}"
              className="w-full pl-8 pr-10 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {checkingUsername && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">⏳</span>
            )}
            {!checkingUsername && usernameAvailable === true && username && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600">✓</span>
            )}
            {!checkingUsername && usernameAvailable === false && username.length >= 3 && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-red-600">✗</span>
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            3-20 characters • lowercase letters, numbers, and underscores only
          </p>
          {usernameAvailable === true && username && username !== originalUsername && (
            <p className="mt-1 text-xs text-green-600">
              ✓ Available! Your profile will be at prompto.com/u/{username}
            </p>
          )}
          {usernameAvailable === false && username.length >= 3 && username !== originalUsername && (
            <p className="mt-1 text-xs text-red-600">
              ✗ Username taken or invalid format
            </p>
          )}
          {username && username === originalUsername && (
            <p className="mt-1 text-xs text-primary">
              Current username
            </p>
          )}
        </div>

        {/* Headline */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Headline</label>
          <input
            type="text"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            placeholder="e.g. Senior Prompt Engineer"
            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Bio */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            placeholder="Tell us about yourself..."
            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-y"
          />
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Location</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. San Francisco, CA"
            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Website */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Website</label>
          <input
            type="url"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            placeholder="e.g. https://yourdomain.com"
            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Current Profile URL */}
        {profile?.username && (
          <div className="bg-primary/10 border border-border rounded-lg p-4">
            <p className="text-sm font-medium text-foreground mb-1">Your Profile URL</p>
            <a
              href={`/u/${profile.username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline"
            >
              prompto.com/u/{profile.username}
            </a>
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end pt-4 border-t">
          <button
            onClick={handleSave}
            disabled={saving || (!!username && username !== originalUsername && usernameAvailable !== true)}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
