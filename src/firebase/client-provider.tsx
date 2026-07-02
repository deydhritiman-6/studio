'use client';

import React, { ReactNode, useMemo } from 'react';
import { FirebaseProvider } from './provider';
import { initializeFirebase } from './index';

/**
 * @fileOverview A client-side wrapper that initializes Firebase and provides it to the application.
 */

export function FirebaseClientProvider({
  children,
}: {
  children: ReactNode;
}) {
  // Initialize Firebase once on the client. 
  // initializeFirebase is idempotent and safe to call in useMemo.
  const { firebaseApp, firestore, auth } = useMemo(() => initializeFirebase(), []);

  return (
    <FirebaseProvider firebaseApp={firebaseApp} firestore={firestore} auth={auth}>
      {children}
    </FirebaseProvider>
  );
}
