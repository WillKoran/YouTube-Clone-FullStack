"use client";
import Image from "next/image";
import Link from "next/link";

import styles from "./navbar.module.css"
import SignIn from "./sign-in";
import { onAuthStateChangedHelper } from "../firebase/firebase";
import { useEffect, useState } from "react";
import { User } from "firebase/auth";
import Upload from "./upload";

// js closure
export default function NavBar() {
    // Init User state
    const [user, setUser] = useState< User | null>(null); // <User | null> explicitly shows that the user variable can either be a User or null otherwise it assumes it is always null
    
    useEffect(() => {
        const unsubscribe = onAuthStateChangedHelper((user) => {
                setUser(user);
        });
        // Cleanup subscripption on unmount
        return () => unsubscribe();
    });

    return (
        <nav className={styles.nav}>
            <Link href="/">              
                    <Image width={90} height={20} 
                 src="/youtube-logo.svg" alt="YouTube Logo" />
            </Link>
            {
                user && <Upload />
            }
            <SignIn user={user}/> 
        </nav>
    );
}