import { useEffect } from 'react';

import { useSupabase } from '@kit/supabase/hooks/use-supabase';

type Notification = {
  id: number;
  body: string;
  dismissed: boolean;
  type: 'info' | 'warning' | 'error';
  created_at: string;
  link: string | null;
};

export function useNotificationsStream(params: {
  onNotifications: (notifications: Notification[]) => void;
  accountIds: string[];
  enabled: boolean;
}) {
  const client = useSupabase();

  useEffect(() => {
    const channel = client.channel('notifications-channel');

    const subscription = channel
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          filter: `account_id=in.(${params.accountIds.join(', ')})`,
          table: 'notifications',
        },
        (payload) => {
          console.log('payload', payload);
          params.onNotifications([payload.new as Notification]);
        },
      )
      .subscribe();

    return () => {
      void subscription?.unsubscribe();
    };
  }, [client, params]);
}
