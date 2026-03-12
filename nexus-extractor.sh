#!/bin/bash
# NEXUS EXTRACTOR — Web Component Scraper
cd ~/.openclaw/workspace/nexus-project
echo '🔍 NEXUS Extractor Agent'
echo '========================'

if [ "$1" = "--cron" ]; then
  # Silent mode for cron — extract from rotating set of sites
  SITES=(
    https://stripe.com https://linear.app https://vercel.com
    https://supabase.com https://resend.com https://neon.tech
    https://cal.com https://dub.co https://railway.app
    https://clerk.com https://www.framer.com https://webflow.com
  )
  # Pick 3 random sites per run
  RANDOM_SITES=($(shuf -e "${SITES[@]}" | head -3))
  for site in "${RANDOM_SITES[@]}"; do
    node agents/nexus-extractor-agent.js --url "$site" 2>/dev/null
  done
  node agents/nexus-extractor-agent.js --stats 2>&1 | grep 'Total'
else
  node agents/nexus-extractor-agent.js "$@"
fi
