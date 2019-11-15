import { useState, useEffect } from 'react';

/**
 * Decide whether Editor should render EditorServer or EditorClient.
 * Note we render EditorServer on the client as well.
 * That's because editor must not be editable until JavaScript is evaluated.
 * https://github.com/facebook/react/issues/14927
 */
export const useClient = (): boolean => {
  const [client, setClient] = useState(false);
  useEffect(() => {
    setClient(true);
  }, []);
  return client;
};
