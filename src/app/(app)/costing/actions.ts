'use server';

import { initializeFirebase } from '@/firebase';
import { collection, doc, setDoc, deleteDoc, updateDoc, getDocs, query, where, orderBy } from 'firebase/firestore';
import type { Costing } from '@/lib/types';

export async function saveCostingAction(costing: Costing) {
  const { firestore } = initializeFirebase();
  const costingRef = doc(firestore, 'costings', costing.id);
  
  const now = new Date().toISOString();
  const finalData = {
    ...costing,
    updatedAt: now,
    createdAt: costing.createdAt || now,
  };

  await setDoc(costingRef, finalData);
  return { id: costing.id };
}

export async function deleteCostingAction(id: string) {
  const { firestore } = initializeFirebase();
  await deleteDoc(doc(firestore, 'costings', id));
}

export async function approveCostingAction(id: string) {
  const { firestore } = initializeFirebase();
  await updateDoc(doc(firestore, 'costings', id), { 
    status: 'Approved', 
    updatedAt: new Date().toISOString() 
  });
}
