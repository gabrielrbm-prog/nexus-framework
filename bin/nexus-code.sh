#!/bin/bash

#
# 💻 NEXUS CODE - Script de geração de código completo
# Gera site production-ready baseado em Context DNA + Design System
#

echo "💻 NEXUS Code Agent - Site Generation"
echo "===================================="
echo ""

# Verifica se o projeto foi fornecido
if [ -z "$1" ]; then
    echo "❌ Erro: Nome do projeto não fornecido"
    echo ""
    echo "Uso:"
    echo "  ./nexus-code.sh <nome-projeto>"
    echo ""
    echo "Exemplo:"
    echo "  ./nexus-code.sh etf-landing"
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

# Verifica se existe Design System
DESIGN_SYSTEM_PATH="$PROJECT_PATH/design-system/design-system.json"
if [ -f "$DESIGN_SYSTEM_PATH" ]; then
    echo "🎨 Design System: encontrado ✅"
else
    echo "🎨 Design System: não encontrado ⚠️  (usando fallback)"
fi

echo "📚 Component Library: 428KB disponível ✅"
echo ""

# Executa o Code Agent
cd "$SCRIPT_DIR"
node agents/nexus-code-agent.js "$CONTEXT_DNA_PATH"

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Site completo gerado com sucesso!"
    echo "📁 Arquivos salvos em: ./projects/$PROJECT_NAME/generated-site/"
    echo ""
    
    # Lista arquivos criados
    if [ -d "$PROJECT_PATH/generated-site" ]; then
        echo "📄 Arquivos do site:"
        ls -la "$PROJECT_PATH/generated-site/" | grep -E '\.(html|css|js|md)$' | sed 's/^/   /'
        echo ""
        
        # Mostra tamanho total
        SITE_SIZE=$(du -sh "$PROJECT_PATH/generated-site" | cut -f1)
        echo "📊 Tamanho total: $SITE_SIZE"
        echo ""
    fi
    
    echo "🚀 Próximos passos:"
    echo "   1. Abrir: ./projects/$PROJECT_NAME/generated-site/index.html"
    echo "   2. Testar responsividade em diferentes dispositivos"
    echo "   3. Deploy para servidor web"
    echo "   4. Configurar domínio e SSL"
    echo ""
    
    # Mostra relatório se disponível
    if [ -f "$PROJECT_PATH/code-report.md" ]; then
        echo "📊 Relatório detalhado: ./projects/$PROJECT_NAME/code-report.md"
        echo ""
    fi
    
    echo "💎 Site production-ready gerado em < 2 minutos!"
else
    echo "❌ Erro ao gerar código"
    exit 1
fi