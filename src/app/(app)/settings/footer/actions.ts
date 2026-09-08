
'use server';

import { initializeFirebase } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';

export async function saveFooterSettingsAction(settings: any) {
  const { firestore } = initializeFirebase();
  const settingsRef = doc(firestore, 'settings', 'footer');
  
  const finalData = {
    ...settings,
    updatedAt: new Date().toISOString(),
  };

  await setDoc(settingsRef, finalData, { merge: true });
  return { success: true };
}
