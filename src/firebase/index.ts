'use client';

// This barrel file re-exports all the necessary hooks and providers.
// It does NOT contain any initialization logic itself.

export * from './provider';
export * from './client-provider';
export * from './auth/use-user';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './errors';
export * from './error-emitter';

// Note: initializeFirebaseSDKs from client.ts is NOT exported here
// to prevent it from being accidentally imported in server components.
