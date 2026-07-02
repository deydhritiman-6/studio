
'use client';

import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore } from 'firebase/firestore';
import { Auth } from 'firebase/auth';
import { errorEmitter } from './error-emitter';
import { FirestorePermissionError } from './errors';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { X, ShieldAlert } from 'lucide-react';

interface FirebaseContextProps {
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
}

const FirebaseContext = createContext<FirebaseContextProps>({
  firebaseApp: null,
  firestore: null,
  auth: null,
});

export function FirebaseProvider({
  children,
  firebaseApp,
  firestore,
  auth,
}: {
  children: ReactNode;
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
}) {
  return (
    <FirebaseContext.Provider value={{ firebaseApp, firestore, auth }}>
      {children}
      <FirebaseErrorListener />
    </FirebaseContext.Provider>
  );
}

function FirebaseErrorListener() {
  const [error, setError] = useState<FirestorePermissionError | null>(null);

  useEffect(() => {
    const handlePermissionError = (err: FirestorePermissionError) => {
      setError(err);
    };

    errorEmitter.on('permission-error', handlePermissionError);
    return () => {
      errorEmitter.removeListener('permission-error', handlePermissionError);
    };
  }, []);

  if (!error) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[100] md:left-auto md:w-[500px] animate-in slide-in-from-bottom-5 duration-300">
      <Alert variant="destructive" className="bg-destructive text-destructive-foreground shadow-2xl border-2">
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle className="font-bold flex items-center justify-between">
          Security Rules Policy Denial
          <button onClick={() => setError(null)} className="hover:opacity-70 transition-opacity">
            <X className="h-4 w-4" />
          </button>
        </AlertTitle>
        <AlertDescription className="mt-2 text-xs font-mono bg-black/10 p-2 rounded max-h-40 overflow-auto">
          <p className="font-bold mb-1">Context:</p>
          <pre>{JSON.stringify(error.context, null, 2)}</pre>
        </AlertDescription>
      </Alert>
    </div>
  );
}

export const useFirebase = () => useContext(FirebaseContext);
export const useFirebaseApp = () => useContext(FirebaseContext).firebaseApp;
export const useFirestore = () => useContext(FirebaseContext).firestore;
export const useAuth = () => useContext(FirebaseContext).auth;
