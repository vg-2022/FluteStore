
'use server';

import { createClient } from '@supabase/supabase-js';
import type { User } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

interface UserData {
  email: string;
  password?: string;
  first_name: string;
  last_name?: string;
  is_admin: boolean;
}

export async function createUser(userData: UserData) {
    if (!userData.password) {
        throw new Error("Password is required to create a new user.");
    }
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        user_metadata: {
            first_name: userData.first_name,
            last_name: userData.last_name,
            is_admin: userData.is_admin,
        },
        email_confirm: true, // Auto-confirm email for admin-created users
    });
    if (error) {
        console.error('Error creating user:', error);
        throw new Error(error.message);
    }
    revalidatePath('/admin/users');
    return data.user;
}

export async function updateUser(userId: string, userData: Partial<UserData>) {
  const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    user_metadata: {
      first_name: userData.first_name,
      last_name: userData.last_name,
      is_admin: userData.is_admin,
    },
  });

  if (error) {
    console.error('Error updating user:', error);
    throw new Error(error.message);
  }
  revalidatePath('/admin/users');
  return data.user;
}

export async function deleteUser(userId: string) {
  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
  if (error) {
    console.error('Error deleting user:', error);
    throw new Error(error.message);
  }
  revalidatePath('/admin/users');
}

export async function banUser(userId: string, banDuration: 'forever' | '24h') {
  const ban_until = banDuration === 'forever' ? 'none' : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  
  const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    ban_duration: banDuration === 'forever' ? 'none' : '24h',
  });

  if (error) {
    console.error('Error banning user:', error);
    throw new Error(error.message);
  }
  revalidatePath('/admin/users');
  return data.user;
}

export async function unbanUser(userId: string) {
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        ban_duration: '0s',
    });

    if (error) {
        console.error('Error unbanning user:', error);
        throw new Error(error.message);
    }
    revalidatePath('/admin/users');
    return data.user;
}
