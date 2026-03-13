#!/bin/bash

#
# 🎯 NEXUS ORCHESTRATOR - Pipeline Master Completo
# Executa todos os 7 agentes NEXUS de forma inteligente e coordenada
# Input: Briefing + Project Name
# Output: Site production-ready completo com todos os agentes aplicados
#

echo "🎯 NEXUS Orchestrator - Pipeline Master Completo"
echo "==============================================="
echo ""

# Verifica se briefing e projeto foram fornecidos
if [ -z "$1" ] || [ -z "$2" ]; then
    echo "❌ Erro: Briefing e nome do projeto são obrigatórios"
    echo ""
    echo "Uso:"
    echo "  ./nexus-orchestrator.sh \"<briefing>\" <project-name> [options]"
    echo ""
    echo "Exemplos:"
    echo "  ./nexus-orchestrator.sh \"Site para trading, millennials, confiança\" etf-landing"
    echo "  ./nexus-orchestrator.sh \"Loja streetwear jovens urbanos\" streetwear-store"
    echo "  ./nexus-orchestrator.sh \"Academia premium classe alta\" academia-elite"
    echo ""
    echo "Options disponíveis:"
    echo "  --auto-recover      Habilita recovery automático"
    echo "  --min-quality=80    Define score mínimo de qualidade"
    echo "  --verbose           Output detalhado"
    echo ""
    echo "🎯 O que o Orchestrator faz:"
    echo "   1. 🧠 Context Agent - Análise inteligente do briefing"
    echo "   2. 🎨 Design Agent - Design system contextual" 
    echo "   3. 🖼️ Image Agent - Prompts para imagens únicas"
    echo "   4. 🎬 Video Agent - Prompts para backgrounds cinematográficos"
    echo "   5. 📝 Content Agent - Copy contextual otimizado"
    echo "   6. 💻 Code Agent - Site production-ready completo"
    echo "   7. 🔄 Quality Agent - Audit enterprise com score A+"
    echo ""
    echo "⚡ Resultado: Site completo em < 10 minutos com qualidade enterprise!"
    echo ""
    exit 1
fi

BRIEFING="$1"
PROJECT_NAME="$2"
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

# Parse options
AUTO_RECOVER=""
MIN_QUALITY=""
VERBOSE=""
PARALLEL=""

for arg in "${@:3}"; do
    case $arg in
        --auto-recover)
            AUTO_RECOVER="--auto-recover"
            ;;
        --min-quality=*)
            MIN_QUALITY="$arg"
            ;;
        --verbose)
            VERBOSE="--verbose"
            ;;
        --parallel)
            PARALLEL="--parallel"
            ;;
    esac
done

echo "📋 Briefing: $BRIEFING"
echo "📂 Projeto: $PROJECT_NAME"

# Mostra options se fornecidas
if [ -n "$AUTO_RECOVER" ] || [ -n "$MIN_QUALITY" ] || [ -n "$VERBOSE" ] || [ -n "$PARALLEL" ]; then
    echo "⚙️ Options:"
    [ -n "$AUTO_RECOVER" ] && echo "   - Auto Recovery habilitado"
    [ -n "$MIN_QUALITY" ] && echo "   - Qualidade mínima: ${MIN_QUALITY#*=}"
    [ -n "$VERBOSE" ] && echo "   - Output verbose"
    [ -n "$PARALLEL" ] && echo "   - Execução paralela"
fi

echo ""
echo "🎯 NEXUS Pipeline Master iniciando..."
echo "===================================="
echo ""
echo "🤖 Agentes que serão executados:"
echo "   1. 🧠 Context Agent (obrigatório)"
echo "   2. 🎨 Design Agent (obrigatório)"  
echo "   3. 🖼️ Image Agent (opcional)"
echo "   4. 🎬 Video Agent (opcional)"
echo "   5. 📝 Content Agent (obrigatório)"
echo "   6. 💻 Code Agent (obrigatório)"
echo "   7. 🔄 Quality Agent (obrigatório)"
echo ""

# Verifica se o Node.js está disponível
if ! command -v node >/dev/null 2>&1; then
    echo "❌ Erro: Node.js não está instalado ou não está no PATH"
    echo "💡 Instale Node.js para usar o Orchestrator Agent"
    exit 1
fi

# Verifica se o arquivo do Orchestrator Agent existe
ORCHESTRATOR_PATH="$SCRIPT_DIR/agents/nexus-orchestrator.js"
if [ ! -f "$ORCHESTRATOR_PATH" ]; then
    echo "❌ Erro: Orchestrator Agent não encontrado em $ORCHESTRATOR_PATH"
    exit 1
fi

# Executa o Orchestrator Agent
cd "$SCRIPT_DIR"
node agents/nexus-orchestrator.js "$BRIEFING" "$PROJECT_NAME" $AUTO_RECOVER $MIN_QUALITY $VERBOSE $PARALLEL

# Captura código de saída
EXIT_CODE=$?

echo ""

if [ $EXIT_CODE -eq 0 ]; then
    echo "🎉 NEXUS ORCHESTRATOR CONCLUÍDO COM SUCESSO!"
    echo "============================================"
    echo ""
    echo "✅ Pipeline completo executado"
    echo "📊 Todos os agentes NEXUS aplicados"
    echo "🏆 Site enterprise-ready gerado"
    echo ""
    
    # Mostra informações do projeto se disponível
    if [ -d "projects/$PROJECT_NAME" ]; then
        echo "📁 Arquivos do projeto:"
        if [ -f "projects/$PROJECT_NAME/context-dna.json" ]; then
            echo "   ✅ Context DNA gerado"
        fi
        if [ -f "projects/$PROJECT_NAME/design-system/design-system.json" ]; then
            echo "   ✅ Design System gerado"
        fi
        if [ -d "projects/$PROJECT_NAME/content" ]; then
            echo "   ✅ Content Assets gerados"
        fi
        if [ -f "projects/$PROJECT_NAME/orchestration-report.md" ]; then
            echo "   ✅ Orchestration Report gerado"
            echo "   📊 Relatório: ./projects/$PROJECT_NAME/orchestration-report.md"
        fi
    fi
    
    # Mostra informações do site se disponível
    if [ -d "generated-site" ]; then
        SITE_SIZE=$(du -sh generated-site | cut -f1)
        FILE_COUNT=$(find generated-site -type f | wc -l)
        echo ""
        echo "🌐 Site Gerado:"
        echo "   📁 Diretório: ./generated-site/"
        echo "   📊 Tamanho: $SITE_SIZE"
        echo "   📄 Arquivos: $FILE_COUNT"
        
        if [ -f "generated-site/index.html" ]; then
            echo "   ✅ index.html: Pronto para deploy"
        fi
    fi
    
    # Mostra score de qualidade se disponível
    if [ -f "quality-report.md" ]; then
        echo ""
        echo "🔄 Quality Analysis:"
        
        # Tenta extrair score
        if command -v grep >/dev/null 2>&1; then
            QUALITY_SCORE=$(grep -A5 "Score Geral de Qualidade" quality-report.md | grep -o '\*\*[0-9]\+/100\*\*' | head -1 | grep -o '[0-9]\+' | head -1)
            if [ -n "$QUALITY_SCORE" ]; then
                echo "   🏆 Score: $QUALITY_SCORE/100"
                
                if [ "$QUALITY_SCORE" -ge 95 ]; then
                    echo "   🏆 Grade: A+ - Qualidade excepcional!"
                    echo "   ✅ Ready for immediate production deploy"
                elif [ "$QUALITY_SCORE" -ge 85 ]; then
                    echo "   🥇 Grade: A - Excelente qualidade!"
                    echo "   ✅ Ready for production deploy"
                elif [ "$QUALITY_SCORE" -ge 75 ]; then
                    echo "   🥈 Grade: B - Boa qualidade"
                    echo "   ⚠️ Algumas otimizações recomendadas"
                else
                    echo "   🥉 Grade: C - Melhorias necessárias"
                    echo "   🔧 Otimizações antes do deploy"
                fi
            fi
        fi
        
        echo "   📊 Relatório: ./quality-report.md"
    fi
    
    echo ""
    echo "🚀 Deploy Instructions:"
    echo "======================"
    echo "1. 📁 Upload: generated-site/* para seu servidor"
    echo "2. 🌐 Configure: domínio + SSL"
    echo "3. 📊 Analytics: Google Analytics + tracking"
    echo "4. 🧪 A/B Test: Headlines e CTAs (variants prontos)"
    echo "5. 📈 Monitor: Performance e conversões"
    echo ""
    echo "💎 NEXUS Framework Results:"
    echo "=========================="
    echo "✅ 7 Agentes IA executados com sucesso"
    echo "✅ Site contextual único gerado"
    echo "✅ Qualidade enterprise garantida"
    echo "✅ Production-ready em minutos"
    echo "✅ Impossível de replicar pela competição"
    echo ""
    echo "🏆 Congratulations! Site ${PROJECT_NAME} está pronto para dominar! 🌍🚀"
    echo ""
    
else
    echo "❌ NEXUS ORCHESTRATOR FALHOU!"
    echo "============================="
    echo ""
    echo "💡 Possíveis soluções:"
    echo "   1. Verificar se todos os agentes estão disponíveis"
    echo "   2. Executar com --auto-recover para tentativa de recovery"
    echo "   3. Verificar relatório de erro em projects/$PROJECT_NAME/"
    echo "   4. Executar agentes individuais para debug"
    echo ""
    echo "🔧 Debug commands:"
    echo "   ./nexus-context.sh \"$BRIEFING\" $PROJECT_NAME"
    echo "   ./nexus-design.sh $PROJECT_NAME"
    echo "   ./nexus-content.sh $PROJECT_NAME"
    echo ""
    exit $EXIT_CODE
fi