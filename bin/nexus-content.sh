#!/bin/bash

#
# 📝 NEXUS CONTENT - Script de geração de copy contextual
# Gera headlines, CTAs, microcopy e A/B variants baseados no Context DNA
#

echo "📝 NEXUS Content Agent - Copy Contextual Otimizado"
echo "================================================="
echo ""

# Verifica se o projeto foi fornecido
if [ -z "$1" ]; then
    echo "❌ Erro: Nome do projeto não fornecido"
    echo ""
    echo "Uso:"
    echo "  ./nexus-content.sh <nome-projeto>"
    echo ""
    echo "Exemplo:"
    echo "  ./nexus-content.sh etf-landing"
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

# Mostra contexto do projeto
BUSINESS_TYPE=$(cat "$CONTEXT_DNA_PATH" | grep -o '"businessType":"[^"]*' | cut -d'"' -f4)
TARGET_AUDIENCE=$(cat "$CONTEXT_DNA_PATH" | grep -o '"primaryAge":"[^"]*' | cut -d'"' -f4)
PSYCHOLOGY=$(cat "$CONTEXT_DNA_PATH" | grep -o '"primary":"[^"]*' | cut -d'"' -f4 | head -1)

echo "🧠 Contexto detectado:"
echo "   Business: $BUSINESS_TYPE"
echo "   Target: $TARGET_AUDIENCE" 
echo "   Psychology: $PSYCHOLOGY"
echo ""

# Executa o Content Agent
cd "$SCRIPT_DIR"
node agents/nexus-content-agent.js "$CONTEXT_DNA_PATH"

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Copy contextual gerado com sucesso!"
    echo "📁 Content salvos em: ./projects/$PROJECT_NAME/content/"
    echo ""
    
    # Mostra estatísticas se disponível
    if [ -f "$PROJECT_PATH/content-report.md" ]; then
        echo "📊 Relatório detalhado: ./projects/$PROJECT_NAME/content-report.md"
        echo ""
    fi
    
    # Lista arquivos criados se existirem
    if [ -d "$PROJECT_PATH/content" ]; then
        CONTENT_FILES=$(ls "$PROJECT_PATH/content"/*.json 2>/dev/null | wc -l)
        if [ $CONTENT_FILES -gt 0 ]; then
            echo "📄 Arquivos de conteúdo gerados: $CONTENT_FILES"
            echo "📁 Estrutura:"
            ls -1 "$PROJECT_PATH/content"/*.json | sed 's|.*/||' | sed 's/^/   - /'
        fi
        echo ""
    fi
    
    # Mostra preview das headlines se disponível
    if [ -f "$PROJECT_PATH/content/headlines.json" ]; then
        echo "🎯 Preview das Headlines:"
        PRIMARY_HEADLINE=$(cat "$PROJECT_PATH/content/headlines.json" | grep -o '"primary":"[^"]*' | cut -d'"' -f4)
        echo "   Principal: \"$PRIMARY_HEADLINE\""
        echo ""
    fi
    
    # Mostra preview dos CTAs se disponível
    if [ -f "$PROJECT_PATH/content/ctas.json" ]; then
        echo "🚀 Preview dos CTAs:"
        PRIMARY_CTA=$(cat "$PROJECT_PATH/content/ctas.json" | grep -o '"primary":"[^"]*' | cut -d'"' -f4)
        echo "   Primário: \"$PRIMARY_CTA\""
        echo ""
    fi
    
    echo "🚀 Próximos passos disponíveis:"
    echo "   1. Revisar conteúdo gerado em content/"
    echo "   2. Testar variantes A/B das headlines"
    echo "   3. Integrar no Code Agent para site completo"
    echo "   4. Implementar tracking de conversão"
    echo ""
    
    echo "💡 Para integração automática:"
    echo "   ./nexus-code.sh \"$PROJECT_NAME\" (regenerar com novo copy)"
    echo ""
else
    echo "❌ Erro ao gerar conteúdo"
    exit 1
fi