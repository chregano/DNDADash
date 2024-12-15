import "src/global.css";

// ----------------------------------------------------------------------

import { CONFIG } from "src/config-global";
import { primary } from "src/theme/core/palette";
import { ThemeProvider } from "src/theme/theme-provider";
import { Snackbar } from 'src/components/snackbar';
import { getInitColorSchemeScript } from "src/theme/color-scheme-script";

import { ProgressBar } from "src/components/progress-bar";
import { MotionLazy } from "src/components/animate/motion-lazy";
import { detectSettings } from "src/components/settings/server";
import {
  SettingsDrawer,
  defaultSettings,
  SettingsProvider,
} from "src/components/settings";

import { UserProvider } from "@auth0/nextjs-auth0/client";


// ----------------------------------------------------------------------
 
export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: primary.main,
};

export default async function RootLayout({ children }) {
  const settings = CONFIG.isStaticExport
    ? defaultSettings
    : await detectSettings();

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        {getInitColorSchemeScript}

        <UserProvider>
            <SettingsProvider
                settings={settings}
                caches={CONFIG.isStaticExport ? "localStorage" : "cookie"}
            >
                <ThemeProvider>
                <MotionLazy>
                    <Snackbar />
                    <ProgressBar />
                    <SettingsDrawer />
                    {children}
                </MotionLazy>
                </ThemeProvider>
            </SettingsProvider>
        </UserProvider>
      </body>
    </html>
  );
}
