import React from 'react';
import { useStore } from '../App';
import { send } from '../client/ipc';
import { Close } from '../icons/Close';
import { Dialog, DialogClose, DialogContent } from '../shared/Dialog';
import { Button } from '../shared/Button';

export const M1Warning = () => {
  const {
      archCheckOpen,
      architectureUnsupported 
  } = useStore(state => ({
      archCheckOpen: state.archCheckOpen,
      architectureUnsupported: state.architectureUnsupported
  }));

  if (!architectureUnsupported) {
    return null;
  }

  return (
    <Dialog open={archCheckOpen} onOpenChange={open => useStore.setState({ archCheckOpen: open })}>
      <DialogContent 
          showCloseIcon={false}
          onOpenAutoFocus={e => e.preventDefault()}
          onEscapeKeyDown={e => e.preventDefault()}
          onPointerDownOutside={e => e.preventDefault()} 
      >
          <h2 className="font-semibold">Apple M1 Unsupported</h2>
          <p className="mt-3">While Port itself can run on Apple M1 architecture, Urbit itself cannot yet. We're actively working on a solution, which is being tracked in this <a href="https://github.com/urbit/urbit/issues/4257">issue</a>. However, you can still use Port to connect to a remote, hosted ship.</p>
          <p className="flex justify-end space-x-4 mt-6">
              <Button onClick={() => send('quit')}>
                  <Close className="w-6 h-6 -ml-1" primary="fill-current" /> Quit Port
              </Button>
              <DialogClose as={Button}>
                  I understand, Proceed anyway
              </DialogClose>
          </p>
      </DialogContent>
    </Dialog>
  )
}