#!/bin/bash

# ============================================================================
# NEXUS DISCOVERY AGENT - Shell Wrapper
# Uso: ./nexus-discovery.sh "Nome da Empresa" [project-id] [opcoes]
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AGENT_PATH="$SCRIPT_DIR/agents/nexus-discovery-agent.js"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Banner
echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║     ${GREEN}NEXUS DISCOVERY AGENT${CYAN}                   ║${NC}"
echo -e "${CYAN}║     ${NC}Coleta automatica de dados da empresa${CYAN}      ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════╝${NC}"
echo ""

# Check if agent file exists
if [ ! -f "$AGENT_PATH" ]; then
    echo -e "${RED}Erro: Agent nao encontrado em $AGENT_PATH${NC}"
    exit 1
fi

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo -e "${RED}Erro: Node.js nao encontrado. Instale o Node.js 18+.${NC}"
    exit 1
fi

# Check arguments
if [ $# -lt 1 ]; then
    echo -e "${YELLOW}Uso:${NC}"
    echo "  ./nexus-discovery.sh \"Nome da Empresa\" [project-id] [opcoes]"
    echo ""
    echo -e "${YELLOW}Opcoes:${NC}"
    echo "  --url <site>          URL do site da empresa"
    echo "  --instagram <handle>  Handle do Instagram"
    echo "  --youtube <handle>    Handle do YouTube"
    echo "  --linkedin <url>      URL do perfil LinkedIn"
    echo "  --sector <setor>      Setor da empresa"
    echo ""
    echo -e "${YELLOW}Exemplos:${NC}"
    echo "  ./nexus-discovery.sh \"Summit Prop\" summit-prop"
    echo "  ./nexus-discovery.sh \"Summit Prop\" summit-prop --url summitprop.com --instagram @summitprop"
    echo ""
    echo -e "${YELLOW}Modo interativo:${NC}"
    echo "  ./nexus-discovery.sh --interactive"
    exit 1
fi

# Interactive mode
if [ "$1" = "--interactive" ] || [ "$1" = "-i" ]; then
    echo -e "${BLUE}Modo interativo${NC}"
    echo ""

    read -p "Nome da empresa: " COMPANY_NAME
    if [ -z "$COMPANY_NAME" ]; then
        echo -e "${RED}Nome da empresa e obrigatorio.${NC}"
        exit 1
    fi

    # Generate default project ID
    DEFAULT_ID=$(echo "$COMPANY_NAME" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-//;s/-$//')
    read -p "Project ID [$DEFAULT_ID]: " PROJECT_ID
    PROJECT_ID=${PROJECT_ID:-$DEFAULT_ID}

    read -p "URL do site (Enter para pular): " SITE_URL
    read -p "Instagram handle (Enter para pular): " INSTAGRAM
    read -p "YouTube handle (Enter para pular): " YOUTUBE
    read -p "LinkedIn URL (Enter para pular): " LINKEDIN
    read -p "Setor da empresa (Enter para auto-detectar): " SECTOR

    # Build command
    CMD="node \"$AGENT_PATH\" \"$COMPANY_NAME\" \"$PROJECT_ID\""
    [ -n "$SITE_URL" ] && CMD="$CMD --url \"$SITE_URL\""
    [ -n "$INSTAGRAM" ] && CMD="$CMD --instagram \"$INSTAGRAM\""
    [ -n "$YOUTUBE" ] && CMD="$CMD --youtube \"$YOUTUBE\""
    [ -n "$LINKEDIN" ] && CMD="$CMD --linkedin \"$LINKEDIN\""
    [ -n "$SECTOR" ] && CMD="$CMD --sector \"$SECTOR\""

    echo ""
    echo -e "${CYAN}Executando: $CMD${NC}"
    echo ""
    eval $CMD
else
    # Direct mode — pass all args to Node
    node "$AGENT_PATH" "$@"
fi

EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
    echo ""
    echo -e "${GREEN}Discovery concluido com sucesso!${NC}"

    # Show where outputs are
    if [ -n "$2" ] && [[ "$2" != --* ]]; then
        PROJECT_DIR="$HOME/.openclaw/workspace/nexus-project/projects/$2"
    else
        PROJECT_DIR="$HOME/.openclaw/workspace/nexus-project/projects/$(echo "$1" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-//;s/-$//')"
    fi

    echo ""
    echo -e "${CYAN}Arquivos gerados:${NC}"
    [ -f "$PROJECT_DIR/company-profile.json" ] && echo "  📄 $PROJECT_DIR/company-profile.json"
    [ -f "$PROJECT_DIR/discovery-report.md" ] && echo "  📝 $PROJECT_DIR/discovery-report.md"
    [ -d "$PROJECT_DIR/discovery" ] && echo "  📁 $PROJECT_DIR/discovery/"
    echo ""
    echo -e "${YELLOW}Proximo passo:${NC} Use o Briefing Agent com o perfil gerado"
    echo "  node agents/nexus-context-agent.js --project $2"
else
    echo ""
    echo -e "${RED}Erro durante o discovery (exit code: $EXIT_CODE)${NC}"
fi

exit $EXIT_CODE
