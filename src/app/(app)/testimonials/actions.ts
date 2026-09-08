
'use server';

import { initializeFirebase } from '@/firebase';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import type { Testimonial } from '@/lib/types';

export async function updateTestimonialStatusAction(id: string, status: Testimonial['status']) {
  const { firestore } = initializeFirebase();
  const ref = doc(firestore, 'testimonials', id);
  
  const now = new Date().toISOString();
  const updateData: any = {
    status,
    updatedAt: now,
  };

  if (status === 'approved') {
    updateData.approvedAt = now;
  }

  await updateDoc(ref, updateData);
}

export async function deleteTestimonialAction(id: string) {
  const { firestore } = initializeFirebase();
  await deleteDoc(doc(firestore, 'testimonials', id));
}
