'use client';

/**
 * @fileOverview Firebase configuration and initialization.
 * 
 * IMPORTANT: To enable real-time synchronization and data persistence:
 * 1. Go to the Firebase Console (https://console.firebase.google.com/)
 * 2. Project Settings > General > Web API Key. Copy and paste it below.
 * 3. Authentication > Sign-in method > Enable 'Anonymous'.
 */

export const firebaseConfig = {
  // Replace this placeholder with your actual Web API Key from the Firebase Console
  apiKey: "AIzaSyB-PLACEHOLDER-KEY-REPLACE-ME", 
  authDomain: "roseberry-chocolate.firebaseapp.com",
  projectId: "roseberry-chocolate",
  storageBucket: "roseberry-chocolate.firebasestorage.app",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};
