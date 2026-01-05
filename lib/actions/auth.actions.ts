'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function signUp(formData: FormData) {
  const supabase = await createClient()
  
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const displayName = formData.get('displayName') as string

  if (!email || !password) {
    throw new Error('Email and password are required')
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName,
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`
    }
  })

  if (error) {
    console.error('Sign up error:', error)
    throw new Error(error.message)
  }

  // If email confirmation is disabled and we have a session, sign in the user
  if (data.session) {
    // Update display name if provided
    if (displayName) {
      try {
        await supabase
          .from('profiles')
          .update({ display_name: displayName })
          .eq('id', data.user.id)
      } catch (updateError) {
        console.error('Profile update error:', updateError)
      }
    }
    
    // Revalidate to ensure session is recognized
    revalidatePath('/', 'layout')
    return { success: true, needsConfirmation: false }
  }

  // If no session but user exists, email confirmation is required
  if (data.user && !data.session) {
    return { success: true, needsConfirmation: true }
  }

  // Fallback
  return { success: true, needsConfirmation: true }
}

export async function signIn(formData: FormData) {
  const supabase = await createClient()
  
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    throw new Error('Email and password are required')
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error('Sign in error:', error)
    throw new Error(error.message)
  }

  revalidatePath('/', 'layout')
  // Return success - let client handle redirect
  return { success: true }
}

export async function signOut() {
  const supabase = await createClient()
  
  const { error } = await supabase.auth.signOut()
  
  if (error) {
    console.error('Sign out error:', error)
    throw new Error(error.message)
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function getUser() {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      // Don't log auth session missing errors as they're expected
      if (error.message !== 'Auth session missing!') {
        console.error('Get user error:', error)
      }
      return null
    }
    
    return user
  } catch (error) {
    // Handle any other errors gracefully
    return null
  }
}