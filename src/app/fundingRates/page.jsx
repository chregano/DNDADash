import { CONFIG } from 'src/config-global';

import { FundingRateView } from 'src/sections/funding-rates/view';

// ----------------------------------------------------------------------

export const metadata = { title: `Funding Rates - ${CONFIG.site.name}` };

export default function Page() {
  return <FundingRateView />;
}
