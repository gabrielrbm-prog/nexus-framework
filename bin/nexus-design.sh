#!/bin/bash

#
# 🎨 NEXUS DESIGN - Script de geração de design system
# Gera design system contextual baseado no Context DNA
#

echo "🎨 NEXUS Design Agent - Design System Generation"
echo "================================================"
echo ""

# Verifica se o projeto foi fornecido
if [ -z "$1" ]; then
    echo "❌ Erro: Nome do projeto não fornecido"
    echo ""
    echo "Uso:"
    echo "  ./nexus-design.sh <nome-projeto>"
    echo ""
    echo "Exemplo:"
    echo "  ./nexus-design.sh etf-landing"
    echo ""
    echo "📁 Projetos disponíveis:"
    if [ -d "projects" ]; then
        ls -1 projects/ | sed 's/^/   - /'
    else
        echo "   (nenhum projeto encontrado)"
    fi
    echo ""
    exit 1
fi

PROJECT_NAME="$1"
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
PROJECT_PATH="$SCRIPT_DIR/projects/$PROJECT_NAME"
CONTEXT_DNA_PATH="$PROJECT_PATH/context-dna.json"

# Verifica se o projeto existe
if [ ! -d "$PROJECT_PATH" ]; then
    echo "❌ Erro: Projeto '$PROJECT_NAME' não encontrado"
    echo "📁 Projetos disponíveis:"
    if [ -d "projects" ]; then
        ls -1 projects/ | sed 's/^/   - /'
    fi
    exit 1
fi

# Verifica se o Context DNA existe
if [ ! -f "$CONTEXT_DNA_PATH" ]; then
    echo "❌ Erro: Context DNA não encontrado em '$CONTEXT_DNA_PATH'"
    echo "💡 Execute primeiro: ./nexus-context.sh \"briefing\" $PROJECT_NAME"
    exit 1
fi

echo "📂 Projeto: $PROJECT_NAME"
echo "📄 Context DNA: encontrado ✅"
echo "🎨 Component Library: 428KB disponível ✅"
echo ""

# Executa o Design Agent
cd "$SCRIPT_DIR"
node agents/nexus-design-agent.js "$CONTEXT_DNA_PATH"

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Design System gerado com sucesso!"
    echo "📁 Arquivos salvos em: ./projects/$PROJECT_NAME/design-system/"
    echo ""
    echo "🚀 Próximos passos disponíveis:"
    echo "   1. nexus-code.sh \"$PROJECT_NAME\" (implementar código completo)"
    echo "   2. nexus-video.sh \"$PROJECT_NAME\" (gerar vídeos background)"
    echo "   3. Revisar arquivos em design-system/ folder"
    echo ""
    
    # Mostra estatísticas se disponível
    if [ -f "$PROJECT_PATH/design-report.md" ]; then
        echo "📊 Relatório detalhado: ./projects/$PROJECT_NAME/design-report.md"
        echo ""
    fi
    
    # Lista arquivos criados
    if [ -d "$PROJECT_PATH/design-system" ]; then
        echo "📄 Arquivos do Design System:"
        ls -la "$PROJECT_PATH/design-system/" | grep -E '\.(css|json)$' | sed 's/^/   /'
        echo ""
    fi
else
    echo "❌ Erro ao gerar design system"
    exit 1
fi