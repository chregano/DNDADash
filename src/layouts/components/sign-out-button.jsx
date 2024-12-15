import { useCallback } from "react";

import Button from "@mui/material/Button";

import { useRouter } from "src/routes/hooks";

// ----------------------------------------------------------------------

export function SignOutButton({ onClose, ...other }) {
//   const router = useRouter();

//   const handleLogout = useCallback(async () => {
//     router.push("/api/auth/logout");
//   }, [onClose, router]);

  return (
    <Button
      fullWidth
      variant="soft"
      size="large"
      color="error"
      href="/api/auth/logout"
      {...other}
    >
      Logout
    </Button>
  );
}
