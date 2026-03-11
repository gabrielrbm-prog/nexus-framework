#!/bin/bash

#
# 🖼️ NEXUS IMAGES - Script de geração de imagens
# Gera imagens contextuais baseadas no Context DNA
#

echo "🖼️ NEXUS Image Agent - Geração de Assets"
echo "========================================"
echo ""

# Verifica se o projeto foi fornecido
if [ -z "$1" ]; then
    echo "❌ Erro: Nome do projeto não fornecido"
    echo ""
    echo "Uso:"
    echo "  ./nexus-images.sh <nome-projeto>"
    echo ""
    echo "Exemplo:"
    echo "  ./nexus-images.sh etf-landing"
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

# Verifica se a API key está configurada
if [ -z "$OPENAI_API_KEY" ]; then
    echo "❌ Erro: OPENAI_API_KEY não configurada"
    echo ""
    echo "Configure a API key:"
    echo "  export OPENAI_API_KEY='sk-...'"
    echo ""
    exit 1
fi

echo "📂 Projeto: $PROJECT_NAME"
echo "📄 Context DNA: encontrado ✅"
echo "🔑 API Key: configurada ✅"
echo ""

# Executa o Image Agent
cd "$SCRIPT_DIR"
node agents/nexus-image-agent.js "$CONTEXT_DNA_PATH"

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Imagens geradas com sucesso!"
    echo "📁 Assets salvos em: ./projects/$PROJECT_NAME/assets/images/"
    echo ""
    echo "🚀 Próximos passos disponíveis:"
    echo "   1. nexus-design.sh \"$PROJECT_NAME\" (criar design system)"
    echo "   2. nexus-code.sh \"$PROJECT_NAME\" (implementar código)"
    echo "   3. nexus-video.sh \"$PROJECT_NAME\" (gerar vídeos background)"
    echo ""
    
    # Mostra estatísticas se disponível
    if [ -f "$PROJECT_PATH/image-report.md" ]; then
        echo "📊 Relatório detalhado: ./projects/$PROJECT_NAME/image-report.md"
        echo ""
    fi
else
    echo "❌ Erro ao gerar imagens"
    exit 1
fi