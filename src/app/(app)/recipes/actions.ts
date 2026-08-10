'use server';

import { initializeFirebase } from '@/firebase';
import { collection, doc, setDoc, getDoc, updateDoc, deleteDoc, addDoc } from 'firebase/firestore';
import type { Recipe, RecipeIngredient } from '@/lib/types';

export async function saveRecipeAction(recipe: Partial<Recipe>, isNewVersion = false) {
  const { firestore } = initializeFirebase();
  const recipeId = recipe.id || `RCP-${Date.now()}`;
  const recipeRef = doc(firestore, 'recipes', recipeId);
  
  const now = new Date().toISOString();
  const finalData = {
    ...recipe,
    id: recipeId,
    updatedAt: now,
    createdAt: recipe.createdAt || now,
    currentVersion: isNewVersion ? (parseFloat(recipe.currentVersion || '1.0') + 0.1).toFixed(1) : (recipe.currentVersion || '1.0'),
  };

  await setDoc(recipeRef, finalData, { merge: true });
  return { id: recipeId, version: finalData.currentVersion };
}

export async function duplicateRecipeAction(recipeId: string) {
  const { firestore } = initializeFirebase();
  const recipeRef = doc(firestore, 'recipes', recipeId);
  const snap = await getDoc(recipeRef);
  
  if (!snap.exists()) throw new Error('Source recipe not found');
  
  const source = snap.data() as Recipe;
  const newId = `RCP-COPY-${Date.now()}`;
  const newData: Recipe = {
    ...source,
    id: newId,
    name: `${source.name} (Copy)`,
    status: 'Draft',
    currentVersion: '1.0',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await setDoc(doc(firestore, 'recipes', newId), newData);
  return { id: newId };
}

export async function archiveRecipeAction(recipeId: string) {
  const { firestore } = initializeFirebase();
  await updateDoc(doc(firestore, 'recipes', recipeId), { status: 'Archived', updatedAt: new Date().toISOString() });
}

export async function deleteRecipeAction(recipeId: string) {
  const { firestore } = initializeFirebase();
  await deleteDoc(doc(firestore, 'recipes', recipeId));
}