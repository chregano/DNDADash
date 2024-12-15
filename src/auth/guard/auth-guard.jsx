"use client";

import { useState, useEffect, useCallback } from "react";

import { paths } from "src/routes/paths";
import { useRouter, usePathname, useSearchParams } from "src/routes/hooks";

import { CONFIG } from "src/config-global";

import { SplashScreen } from "src/components/loading-screen";

import { useUser } from "@auth0/nextjs-auth0/client";

// ----------------------------------------------------------------------

export function AuthGuard({ children }) {
  const router = useRouter();

  const pathname = usePathname();

  const searchParams = useSearchParams();

  const { user, error, isLoading } = useUser();

  const [isChecking, setIsChecking] = useState(true);

  const createQueryString = useCallback(
    (name, value) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(name, value);

      return params.toString();
    },
    [searchParams]
  );

  const checkPermissions = async () => {
    if (isLoading) {
      return;
    }

    if (!user) {
      const signInPath = paths.auth.signIn;

      const href = `/api/auth/login/?${createQueryString("returnTo", pathname)}`;

      router.replace(href);
      return;
    }

    setIsChecking(false);
  };

  useEffect(() => {
    checkPermissions();
  }, [isLoading]);

  if (isChecking) {
    return <SplashScreen />;
  }

  return <>{children}</>;
}
