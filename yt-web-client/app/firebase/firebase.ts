// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {getAuth, signInWithPopup, GoogleAuthProvider,onAuthStateChanged, User} from "firebase/auth";
import {getFunctions} from "firebase/functions";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCo8G5LOnTNkvCiADXFtjvptD5xeJr2FYM",
  authDomain: "clone-25a2b.firebaseapp.com",
  projectId: "clone-25a2b",
  appId: "1:55681089710:web:fb5b6251fdbee2781aed3f",
  measurementId: "G-90P17WGGFB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const auth = getAuth(app)


export const functions = getFunctions(app);

/**
 * Signs in user with google popup.
 * @returns A promise that resolves with the user's credentials.
 */
export function signInWithGoogle() {
    return signInWithPopup(auth, new GoogleAuthProvider());
}

/**
 * Signs the user out.
 * @returns A promise that resolves when the user is signed out.
 */
export function signOut() {
    return auth.signOut();
}

/**
 * Trigger a callback when the user auth state changes.
 * @returns A function to unsubscribe callback.
 */
export function onAuthStateChangedHelper(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
}