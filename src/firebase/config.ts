'use client';

/**
 * @fileOverview Firebase configuration and initialization.
 * This configuration is safe to be public as access is restricted by Security Rules.
 */

// IMPORTANT: Replace the apiKey, messagingSenderId, and appId with your actual 
// values from the Firebase Console (Project Settings > General > Your apps).
export const firebaseConfig = {
  apiKey: "AIzaSyA-REPLACE-WITH-YOUR-ACTUAL-API-KEY", 
  authDomain: "roseberry-chocolate.firebaseapp.com",
  projectId: "roseberry-chocolate",
  storageBucket: "roseberry-chocolate.firebasestorage.app",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};
