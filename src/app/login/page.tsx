import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import LoginClient from './LoginClient';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const params = await searchParams;
  
  // Check if user is already authenticated on the server
  const session = await getServerSession();
  
  if (session) {
    // User is already logged in, redirect to callback URL or home
    redirect(params.callbackUrl || '/');
  }

  // User is not authenticated, show login page
  return <LoginClient callbackUrl={params.callbackUrl} error={params.error} />;
}
