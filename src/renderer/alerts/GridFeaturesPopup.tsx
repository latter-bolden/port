import React, { useCallback } from 'react';
import { useQueryClient } from 'react-query';
import { useStore } from '../App';
import { send } from '../client/ipc';
import { Dialog, DialogContent } from '../shared/Dialog';

export const GridFeaturesPopup = () => {
  const queryClient = useQueryClient();
  const {
      architectureUnsupported,
      seenGridModal
  } = useStore(state => ({
      seenGridModal: state.settings['seen-grid-update-modal'],
      architectureUnsupported: state.architectureUnsupported
  }));

  const markSeen = useCallback(async () => {
    await send('set-setting', 'seen-grid-update-modal', 'true')
    useStore.setState(state => ({ settings: {...state.settings, 'seen-grid-update-modal': 'true' } }))
    queryClient.invalidateQueries('settings');
  }, []);

  if (architectureUnsupported || seenGridModal === 'true') {
    return null;
  }

  return (
    <Dialog defaultOpen onOpenChange={markSeen}>
      <DialogContent 
          showCloseIcon
          onOpenAutoFocus={e => e.preventDefault()}
      >
          <h2 className="font-semibold">Improved Support for Urbit Apps</h2>
          <p className="mt-3">Port now has the capability to open Leap from anywhere on your computer, regardless of what app you have focused. Simply use <kbd>Cmd+/</kbd> or <kbd>Ctrl+/</kbd>.</p>
          <p className="mt-3">In addition, Port now supports cycling through all open windows using <kbd>Ctrl+Tab</kbd>. Now you can quickly switch between Urbit apps, just like your desktop!</p>
      </DialogContent>
    </Dialog>
  )
}