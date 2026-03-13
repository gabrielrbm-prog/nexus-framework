#!/bin/bash
#
# NEXUS BRIEFING AGENT — Shell Wrapper
# Gera perguntas de briefing adaptativas e creative brief completo
#
# Uso:
#   ./nexus-briefing.sh <project-name>              # Pipeline completo
#   ./nexus-briefing.sh <project-name> --questions   # Só gera perguntas
#   ./nexus-briefing.sh <project-name> --brief        # Só gera brief (precisa de answers)
#   ./nexus-briefing.sh --demo                        # Demo com dados de exemplo
#
# Requer: company-profile.json ou context-dna.json em projects/<name>/
# Gera:   briefing-questions.json, creative-brief.json, briefing-report.html

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
AGENT_SCRIPT="${SCRIPT_DIR}/agents/nexus-briefing-agent.js"
PROJECTS_DIR="${SCRIPT_DIR}/projects"

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

print_banner() {
  echo ""
  echo -e "${CYAN}╔══════════════════════════════════════════════════════════╗${NC}"
  echo -e "${CYAN}║${NC}  ${BOLD}NEXUS BRIEFING AGENT${NC}                                   ${CYAN}║${NC}"
  echo -e "${CYAN}║${NC}  ${BLUE}Gerador inteligente de briefing criativo${NC}                ${CYAN}║${NC}"
  echo -e "${CYAN}╚══════════════════════════════════════════════════════════╝${NC}"
  echo ""
}

print_usage() {
  echo -e "${BOLD}Uso:${NC}"
  echo "  $0 <project-name>              # Pipeline completo"
  echo "  $0 <project-name> --questions   # Gera perguntas apenas"
  echo "  $0 <project-name> --brief       # Gera brief + relatório"
  echo "  $0 --demo                       # Demo com dados de exemplo"
  echo ""
  echo -e "${BOLD}Projetos disponíveis:${NC}"
  if [ -d "$PROJECTS_DIR" ]; then
    for dir in "$PROJECTS_DIR"/*/; do
      if [ -d "$dir" ]; then
        name=$(basename "$dir")
        has_profile=""
        [ -f "$dir/company-profile.json" ] && has_profile="company-profile.json"
        [ -f "$dir/context-dna.json" ] && has_profile="${has_profile:+$has_profile, }context-dna.json"
        has_answers=""
        [ -f "$dir/briefing-answers.json" ] && has_answers=" + answers"
        has_brief=""
        [ -f "$dir/creative-brief.json" ] && has_brief=" [BRIEF PRONTO]"
        if [ -n "$has_profile" ]; then
          echo -e "  ${GREEN}●${NC} ${name} ${BLUE}(${has_profile}${has_answers})${NC}${YELLOW}${has_brief}${NC}"
        else
          echo -e "  ${RED}○${NC} ${name} ${RED}(sem perfil)${NC}"
        fi
      fi
    done
  fi
  echo ""
}

# Verificar se o agent script existe
if [ ! -f "$AGENT_SCRIPT" ]; then
  echo -e "${RED}[ERRO]${NC} Agent não encontrado em: $AGENT_SCRIPT"
  exit 1
fi

# Parse de argumentos
PROJECT_NAME=""
MODE=""
DEMO=false

for arg in "$@"; do
  case "$arg" in
    --demo)
      DEMO=true
      ;;
    --questions)
      MODE="--questions"
      ;;
    --brief)
      MODE="--brief"
      ;;
    --help|-h)
      print_banner
      print_usage
      exit 0
      ;;
    *)
      if [ -z "$PROJECT_NAME" ]; then
        PROJECT_NAME="$arg"
      fi
      ;;
  esac
done

print_banner

# Modo demo
if [ "$DEMO" = true ]; then
  echo -e "${YELLOW}[DEMO]${NC} Executando pipeline de demonstração..."
  echo ""
  node "$AGENT_SCRIPT" --demo
  
  DEMO_DIR="${PROJECTS_DIR}/summit-prop-demo"
  echo ""
  echo -e "${GREEN}[OK]${NC} Arquivos gerados em: ${DEMO_DIR}"
  echo ""
  
  # Listar arquivos gerados
  if [ -d "$DEMO_DIR" ]; then
    echo -e "${BOLD}Arquivos:${NC}"
    ls -la "$DEMO_DIR"/briefing-* "$DEMO_DIR"/creative-* 2>/dev/null | while read line; do
      echo "  $line"
    done
  fi
  
  echo ""
  echo -e "${CYAN}Para visualizar o relatório:${NC}"
  echo "  Copie briefing-report.html para sua máquina e abra no navegador"
  echo "  Ou converta para PDF: wkhtmltopdf ${DEMO_DIR}/briefing-report.html brief.pdf"
  echo ""
  exit 0
fi

# Verificar projeto
if [ -z "$PROJECT_NAME" ]; then
  echo -e "${RED}[ERRO]${NC} Nome do projeto não informado."
  echo ""
  print_usage
  exit 1
fi

PROJECT_DIR="${PROJECTS_DIR}/${PROJECT_NAME}"

# Verificar diretório do projeto
if [ ! -d "$PROJECT_DIR" ]; then
  echo -e "${RED}[ERRO]${NC} Projeto não encontrado: ${PROJECT_DIR}"
  echo ""
  print_usage
  exit 1
fi

# Verificar perfil
HAS_PROFILE=false
[ -f "$PROJECT_DIR/company-profile.json" ] && HAS_PROFILE=true
[ -f "$PROJECT_DIR/context-dna.json" ] && HAS_PROFILE=true

if [ "$HAS_PROFILE" = false ]; then
  echo -e "${RED}[ERRO]${NC} Nenhum perfil encontrado para '${PROJECT_NAME}'."
  echo "  Esperado: company-profile.json ou context-dna.json"
  exit 1
fi

echo -e "${GREEN}[OK]${NC} Projeto: ${BOLD}${PROJECT_NAME}${NC}"
echo -e "${GREEN}[OK]${NC} Diretório: ${PROJECT_DIR}"
echo ""

# Executar agent
if [ -n "$MODE" ]; then
  node "$AGENT_SCRIPT" "$PROJECT_NAME" "$MODE"
else
  node "$AGENT_SCRIPT" "$PROJECT_NAME"
fi

echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Concluído com sucesso!${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
echo ""
