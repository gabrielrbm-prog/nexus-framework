#!/bin/bash

#
# 🔄 NEXUS QUALITY - Script de audit completo de qualidade
# Analisa performance, accessibility, SEO, security e mais
#

echo "🔄 NEXUS Quality Agent - Audit Completo de Qualidade"
echo "=================================================="
echo ""

# Verifica se o projeto foi fornecido
if [ -z "$1" ]; then
    echo "❌ Erro: Nome do projeto não fornecido"
    echo ""
    echo "Uso:"
    echo "  ./nexus-quality.sh <nome-projeto>"
    echo ""
    echo "Exemplo:"
    echo "  ./nexus-quality.sh etf-landing"
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

# Encontra o diretório do site gerado
SITE_DIRECTORY=""
if [ -d "$SCRIPT_DIR/generated-site" ]; then
    SITE_DIRECTORY="$SCRIPT_DIR/generated-site"
elif [ -d "$PROJECT_PATH/generated-site" ]; then
    SITE_DIRECTORY="$PROJECT_PATH/generated-site"
else
    echo "❌ Erro: Site gerado não encontrado"
    echo "💡 Execute primeiro: ./nexus-code.sh $PROJECT_NAME"
    echo "📁 Procurado em:"
    echo "   - $SCRIPT_DIR/generated-site/"
    echo "   - $PROJECT_PATH/generated-site/"
    exit 1
fi

echo "📂 Projeto: $PROJECT_NAME"
echo "📄 Context DNA: encontrado ✅"
echo "📁 Site Directory: $SITE_DIRECTORY"

# Mostra informações do site
if [ -f "$SITE_DIRECTORY/index.html" ]; then
    SITE_SIZE=$(du -sh "$SITE_DIRECTORY" | cut -f1)
    FILE_COUNT=$(find "$SITE_DIRECTORY" -type f | wc -l)
    echo "📊 Site Info:"
    echo "   Tamanho: $SITE_SIZE"
    echo "   Arquivos: $FILE_COUNT"
else
    echo "⚠️ index.html não encontrado no site"
fi

echo ""
echo "🔍 Categorias de Audit:"
echo "   ⚡ Performance & Load Testing"
echo "   ♿ Accessibility (WCAG 2.1)"
echo "   📈 SEO & Meta Content" 
echo "   💻 Code Quality & Structure"
echo "   🔒 Security & Vulnerabilities"
echo "   🌐 Browser Compatibility"
echo "   📱 Mobile Responsiveness"
echo ""

# Executa o Quality Agent
cd "$SCRIPT_DIR"
node agents/nexus-quality-agent.js "$CONTEXT_DNA_PATH" "$SITE_DIRECTORY"

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Audit de qualidade concluído com sucesso!"
    
    # Mostra estatísticas se disponível
    QUALITY_REPORT_PATH=""
    if [ -f "$PROJECT_PATH/quality-report.md" ]; then
        QUALITY_REPORT_PATH="$PROJECT_PATH/quality-report.md"
        echo "📊 Relatório detalhado: ./projects/$PROJECT_NAME/quality-report.md"
    elif [ -f "$SCRIPT_DIR/quality-report.md" ]; then
        QUALITY_REPORT_PATH="$SCRIPT_DIR/quality-report.md"
        echo "📊 Relatório detalhado: ./quality-report.md"
    fi
    
    if [ -n "$QUALITY_REPORT_PATH" ]; then
        echo ""
        
        # Extrai score geral se possível
        if command -v grep >/dev/null 2>&1; then
            OVERALL_SCORE=$(grep -A5 "Score Geral de Qualidade" "$QUALITY_REPORT_PATH" | grep -o '\*\*[0-9]\+/100\*\*' | head -1 | grep -o '[0-9]\+' | head -1)
            if [ -n "$OVERALL_SCORE" ]; then
                echo "🎯 Score Geral: $OVERALL_SCORE/100"
                
                if [ "$OVERALL_SCORE" -ge 95 ]; then
                    echo "🏆 Grade: A+ - Qualidade excepcional!"
                    SITE_QUALITY="excellent"
                elif [ "$OVERALL_SCORE" -ge 85 ]; then
                    echo "🥇 Grade: A - Excelente qualidade!"
                    SITE_QUALITY="great"
                elif [ "$OVERALL_SCORE" -ge 75 ]; then
                    echo "🥈 Grade: B - Boa qualidade, algumas melhorias"
                    SITE_QUALITY="good"
                else
                    echo "🥉 Grade: C - Melhorias necessárias"
                    SITE_QUALITY="needs_work"
                fi
                echo ""
            fi
        fi
    fi
    
    echo "🚀 Próximos passos disponíveis:"
    echo "   1. Revisar relatório detalhado em quality-report.md"
    echo "   2. Implementar otimizações high priority"
    echo "   3. Re-executar audit após otimizações"
    echo "   4. Deploy com confiança em produção"
    echo ""
    
    echo "💡 Para implementar otimizações:"
    echo "   1. Seguir Action Items do relatório"
    echo "   2. Re-executar: ./nexus-quality.sh \"$PROJECT_NAME\""
    echo "   3. Comparar scores before/after"
    echo ""
    
    echo "🎯 Site está pronto para:"
    if [ "$SITE_QUALITY" = "excellent" ]; then
        echo "   ✅ Deploy imediato em produção"
        echo "   ✅ Tráfego de alta escala"  
        echo "   ✅ Otimização de conversão máxima"
        echo "   🏆 Qualidade premium garantida"
    elif [ "$SITE_QUALITY" = "great" ]; then
        echo "   ✅ Deploy em produção" 
        echo "   ✅ Tráfego de alta escala"
        echo "   ✅ Otimização de conversão"
    elif [ "$SITE_QUALITY" = "good" ]; then
        echo "   ⚠️ Deploy com algumas otimizações"
        echo "   ✅ Tráfego médio"
        echo "   ⚠️ Melhorias de conversão recomendadas"
    else
        echo "   ❌ Otimizações antes do deploy"
        echo "   ⚠️ Tráfego limitado recomendado"
        echo "   🔧 Melhorias críticas necessárias"
    fi
    echo ""
else
    echo "❌ Erro no audit de qualidade"
    exit 1
fi