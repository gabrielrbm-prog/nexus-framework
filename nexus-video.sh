#!/bin/bash

#
# 🎬 NEXUS VIDEO - Script de geração de vídeos cinematográficos
# Gera backgrounds únicos baseados no Context DNA
#

echo "🎬 NEXUS Video Agent - Backgrounds Cinematográficos"
echo "=================================================="
echo ""

# Verifica se o projeto foi fornecido
if [ -z "$1" ]; then
    echo "❌ Erro: Nome do projeto não fornecido"
    echo ""
    echo "Uso:"
    echo "  ./nexus-video.sh <nome-projeto>"
    echo ""
    echo "Exemplo:"
    echo "  ./nexus-video.sh etf-landing"
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

# Verifica APIs disponíveis
HAS_RUNWAY=false
HAS_PIKA=false
HAS_OPENAI=false

if [ -n "$RUNWAY_API_KEY" ]; then
    echo "🎬 RunwayML Gen-3: configurada ✅"
    HAS_RUNWAY=true
fi

if [ -n "$PIKA_API_KEY" ]; then
    echo "🎨 Pika Labs: configurada ✅"
    HAS_PIKA=true
fi

if [ -n "$OPENAI_API_KEY" ]; then
    echo "🤖 OpenAI: configurada ✅"
    HAS_OPENAI=true
fi

if [ "$HAS_RUNWAY" = false ] && [ "$HAS_PIKA" = false ] && [ "$HAS_OPENAI" = false ]; then
    echo "⚠️ Nenhuma API key configurada - modo demonstração"
    echo "💡 Para vídeos reais, configure:"
    echo "   export RUNWAY_API_KEY='your-key'"
    echo "   export PIKA_API_KEY='your-key'"
    echo ""
else
    echo "🎯 API keys configuradas - vídeos reais serão gerados!"
fi

echo ""

# Executa o Video Agent
cd "$SCRIPT_DIR"
node agents/nexus-video-agent.js "$CONTEXT_DNA_PATH"

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Vídeos cinematográficos gerados com sucesso!"
    echo "📁 Assets salvos em: ./projects/$PROJECT_NAME/assets/videos/"
    echo ""
    
    # Mostra estatísticas se disponível
    if [ -f "$PROJECT_PATH/video-report.md" ]; then
        echo "📊 Relatório detalhado: ./projects/$PROJECT_NAME/video-report.md"
        echo ""
    fi
    
    # Lista arquivos criados se existirem
    if [ -d "$PROJECT_PATH/assets/videos" ]; then
        VIDEO_COUNT=$(find "$PROJECT_PATH/assets/videos" -name "*.mp4" 2>/dev/null | wc -l)
        if [ $VIDEO_COUNT -gt 0 ]; then
            echo "🎬 Vídeos gerados: $VIDEO_COUNT arquivos MP4"
            echo "📁 Estrutura:"
            find "$PROJECT_PATH/assets/videos" -type d | sed 's/^/   /'
        else
            echo "🎭 Modo demonstração - prompts gerados, vídeos simulados"
        fi
        echo ""
    fi
    
    echo "🚀 Próximos passos disponíveis:"
    echo "   1. Integrar vídeos como backgrounds no site"
    echo "   2. Otimizar para web (compressão)"
    echo "   3. Testar performance de loading"
    echo "   4. A/B test diferentes estilos"
    echo ""
    
    echo "💡 Para integração automática:"
    echo "   ./nexus-code.sh \"$PROJECT_NAME\" (regenerar com vídeos)"
    echo ""
else
    echo "❌ Erro ao gerar vídeos"
    exit 1
fi