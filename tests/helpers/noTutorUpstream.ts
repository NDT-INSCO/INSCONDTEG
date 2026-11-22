// Isolated child process for the actual Express routes; never contacts a model.
globalThis.fetch = async () => {
  process.send?.({ type: 'attempted_upstream' });
  throw new Error('Unexpected upstream request in tutor protocol test');
};
await import('../../server');
