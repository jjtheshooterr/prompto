"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { createBrowserClient } from "@supabase/ssr";
import { ThemeProvider } from "@/components/theme-provider";

type AuthCtx = {
    session: Session | null;
    user: User | null;
    loading: boolean;
};

const AuthContext = createContext<AuthCtx>({ session: null, user: null, loading: true });

export function Providers({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    const supabase = useMemo(() => {
        return createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
    }, []);

    useEffect(() => {
        let mounted = true;

        supabase.auth.getSession().then(({ data }) => {
            if (!mounted) return;
            setSession(data.session ?? null);
            setLoading(false);
        });

        const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
            setSession(nextSession);
            setLoading(false);
        });

        return () => {
            mounted = false;
            sub.subscription.unsubscribe();
        };
    }, [supabase]);

    const value = useMemo(
        () => ({
            session,
            user: session?.user ?? null,
            loading,
        }),
        [session, loading]
    );

    return (
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
        </ThemeProvider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
