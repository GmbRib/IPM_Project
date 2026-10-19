import { Redirect } from 'expo-router';

import { useSession } from '@/stores/session';

/** Entry point: sends each user to where they belong. */
export default function Index() {
  const status = useSession((s) => s.status);
  const onboarded = useSession((s) => s.user?.onboarded ?? false);

  if (status === 'signedOut') return <Redirect href="/welcome" />;
  if (!onboarded) return <Redirect href="/step-1" />;
  return <Redirect href="/calendario" />;
}
