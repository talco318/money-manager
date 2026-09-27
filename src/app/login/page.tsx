import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import LoginClient from './LoginClient';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const params = await searchParams;
  
  // Check if user is already authenticated on the server
  const session = await getServerSession(authOptions);
  
  if (session) {
    // User is already logged in, redirect to callback URL or home
    const rawTarget = params.callbackUrl || '/';
    const target = rawTarget.startsWith('/login') ? '/' : rawTarget;
    redirect(target);
  }

  // User is not authenticated, show login page
  return <LoginClient callbackUrl={params.callbackUrl} error={params.error} />;
}
