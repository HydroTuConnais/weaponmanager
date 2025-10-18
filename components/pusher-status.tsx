'use client';

import { useEffect, useState } from 'react';
import Pusher from 'pusher-js';
import { Wifi, WifiOff } from 'lucide-react';

let pusherClient: Pusher | null = null;

function getPusherClient() {
  if (!pusherClient) {
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

    if (!key || !cluster) {
      return null;
    }

    pusherClient = new Pusher(key, {
      cluster,
    });
  }

  return pusherClient;
}

export function PusherStatus() {
  const [connectionState, setConnectionState] = useState<string>('initializing');

  useEffect(() => {
    const pusher = getPusherClient();
    if (!pusher) {
      setConnectionState('unavailable');
      return;
    }

    // État initial
    setConnectionState(pusher.connection.state);

    // Écouter les changements d'état
    const stateChangeHandler = (states: any) => {
      setConnectionState(states.current);
    };

    pusher.connection.bind('state_change', stateChangeHandler);

    return () => {
      pusher.connection.unbind('state_change', stateChangeHandler);
    };
  }, []);

  const getIconColor = () => {
    switch (connectionState) {
      case 'connected':
        return 'text-green-500';
      case 'connecting':
        return 'text-yellow-500 animate-pulse';
      case 'unavailable':
      case 'failed':
        return 'text-red-500';
      case 'disconnected':
        return 'text-gray-500';
      default:
        return 'text-gray-400';
    }
  };

  const isDisconnected = connectionState === 'unavailable' || connectionState === 'failed' || connectionState === 'disconnected';

  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-full shadow-lg p-2 border border-gray-200 z-50">
      {isDisconnected ? (
        <WifiOff className={`w-5 h-5 ${getIconColor()}`} />
      ) : (
        <Wifi className={`w-5 h-5 ${getIconColor()}`} />
      )}
    </div>
  );
}
