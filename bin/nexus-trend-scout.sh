#!/bin/bash
# ============================================================
# NEXUS Trend Scout - Shell Wrapper
# ============================================================
# Runs the Trend Scout Agent to build/update the references DB
#
# Usage:
#   ./nexus-trend-scout.sh              # Build or show existing DB
#   ./nexus-trend-scout.sh --update     # Force refresh all data
#   ./nexus-trend-scout.sh --summary    # Show stats summary
#   ./nexus-trend-scout.sh --nicho saas # Show specific nicho details
#   ./nexus-trend-scout.sh --cron       # Silent mode for cron jobs
# ============================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AGENT_FILE="${SCRIPT_DIR}/agents/nexus-trend-scout-agent.js"
LOG_DIR="${SCRIPT_DIR}/logs"
LOG_FILE="${LOG_DIR}/trend-scout-$(date +%Y%m%d).log"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

# Ensure log directory exists
mkdir -p "${LOG_DIR}"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}[ERROR] Node.js not found. Install Node.js first.${NC}"
    exit 1
fi

# Check agent file
if [ ! -f "${AGENT_FILE}" ]; then
    echo -e "${RED}[ERROR] Agent file not found: ${AGENT_FILE}${NC}"
    exit 1
fi

# Parse args
CRON_MODE=false
PASS_ARGS=()

for arg in "$@"; do
    if [ "$arg" = "--cron" ]; then
        CRON_MODE=true
        PASS_ARGS+=("--update")
    else
        PASS_ARGS+=("$arg")
    fi
done

# Run
if [ "$CRON_MODE" = true ]; then
    # Silent mode for cron - log only
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Trend Scout cron run started" >> "${LOG_FILE}"
    node "${AGENT_FILE}" "${PASS_ARGS[@]}" >> "${LOG_FILE}" 2>&1
    EXIT_CODE=$?
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Trend Scout cron run finished (exit: ${EXIT_CODE})" >> "${LOG_FILE}"
    exit ${EXIT_CODE}
else
    # Interactive mode
    echo -e "${CYAN}"
    echo "  =================================================="
    echo "     NEXUS Trend Scout"
    echo "  =================================================="
    echo -e "${NC}"

    node "${AGENT_FILE}" "${PASS_ARGS[@]}" 2>&1 | tee -a "${LOG_FILE}"
    EXIT_CODE=${PIPESTATUS[0]}

    if [ ${EXIT_CODE} -eq 0 ]; then
        echo -e "${GREEN}  Trend Scout completed successfully.${NC}"
    else
        echo -e "${RED}  Trend Scout failed with exit code ${EXIT_CODE}.${NC}"
    fi

    echo ""
    echo -e "  Log: ${YELLOW}${LOG_FILE}${NC}"
    echo ""
    exit ${EXIT_CODE}
fi
