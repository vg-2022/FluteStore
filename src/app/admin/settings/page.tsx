'use client';
import { redirect } from 'next/navigation';

// Redirect to the default general settings tab
export default function SettingsPage() {
    redirect('/admin/settings/general');
}
