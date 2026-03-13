#!/bin/bash

#
# 🧠 NEXUS CONTEXT - Script de lançamento rápido
# Análise de briefing e geração de Context DNA
#

echo "🧠 NEXUS Context Agent - Análise de Briefing"
echo "============================================="
echo ""

# Verifica se o briefing foi fornecido
if [ -z "$1" ]; then
    echo "❌ Erro: Briefing não fornecido"
    echo ""
    echo "Uso:"
    echo "  ./nexus-context.sh \"Seu briefing aqui\" [nome-projeto]"
    echo ""
    echo "Exemplo:"
    echo "  ./nexus-context.sh \"Site para fintech de pagamentos\" meu-projeto"
    echo ""
    exit 1
fi

BRIEFING="$1"
PROJECT_NAME="${2:-projeto-$(date +%s)}"
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

echo "📋 Briefing: $BRIEFING"
echo "📂 Projeto: $PROJECT_NAME"
echo ""

# Executa o Context Agent
cd "$SCRIPT_DIR"
node agents/nexus-context-agent.js "$BRIEFING" "$PROJECT_NAME"

if [ $? -eq 0 ]; then
    echo ""
    echo "🎯 Context DNA gerado com sucesso!"
    echo "📁 Arquivos salvos em: ./projects/$PROJECT_NAME/"
    echo ""
    echo "🚀 Próximos passos disponíveis:"
    echo "   1. nexus-design.sh \"$PROJECT_NAME\" (criar design system)"
    echo "   2. nexus-images.sh \"$PROJECT_NAME\" (gerar imagens)"  
    echo "   3. nexus-code.sh \"$PROJECT_NAME\" (implementar código)"
    echo ""
else
    echo "❌ Erro ao gerar Context DNA"
    exit 1
fi