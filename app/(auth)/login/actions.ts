'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  console.log('=== LOGIN ACTION CALLED ===')
  
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  console.log('Login attempt for:', data.email)

  const { error, data: authData } = await supabase.auth.signInWithPassword(data)

  if (error) {
    console.log('Login error:', error.message)
    redirect('/login?error=' + encodeURIComponent(error.message))
  }

  console.log('Login successful!')
  console.log('User:', authData.user?.email)
  console.log('Session exists:', !!authData.session)

  revalidatePath('/', 'layout')
  console.log('Redirecting to dashboard...')
  redirect('/dashboard')
}

export async function signup(formData: FormData) {
  console.log('=== SIGNUP ACTION CALLED ===')
  
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  console.log('Signup attempt for:', data.email)

  const { error } = await supabase.auth.signUp(data)

  if (error) {
    console.log('Signup error:', error.message)
    redirect('/login?error=' + encodeURIComponent(error.message))
  }

  console.log('Signup successful!')
  revalidatePath('/', 'layout')
  redirect('/login?message=Check email to continue sign in process')
}