import { paths } from 'src/routes/paths';

import packageJson from '../package.json';

// ----------------------------------------------------------------------

export const CONFIG = {
  site: {
    name: 'OFlynnBros',
    serverUrl: process.env.NEXT_PUBLIC_SERVER_URL ?? '',
    assetURL: process.env.NEXT_PUBLIC_ASSET_URL ?? '',
    basePath: process.env.NEXT_PUBLIC_BASE_PATH ?? '',
    apiBaseURL: process.env.NEXT_PUBLIC_API_BASE_URL ?? '',
    version: packageJson.version,
  },
  auth: {
    redirectPath: paths.dashboard.root,
  },
  isStaticExport: JSON.parse(`${process.env.BUILD_STATIC_EXPORT}`)
};
