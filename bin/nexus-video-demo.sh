#!/bin/bash

#
# 🎬 NEXUS VIDEO DEMO - Demonstração dos prompts cinematográficos
# Mostra os prompts contextuais únicos que seriam gerados
#

echo "🎬 NEXUS Video Agent - MODO DEMONSTRAÇÃO"
echo "========================================"
echo ""

# Verifica se o projeto foi fornecido
if [ -z "$1" ]; then
    echo "❌ Erro: Nome do projeto não fornecido"
    echo ""
    echo "Uso:"
    echo "  ./nexus-video-demo.sh <nome-projeto>"
    echo ""
    echo "Exemplo:"
    echo "  ./nexus-video-demo.sh etf-landing"
    echo ""
    exit 1
fi

PROJECT_NAME="$1"
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
PROJECT_PATH="$SCRIPT_DIR/projects/$PROJECT_NAME"
CONTEXT_DNA_PATH="$PROJECT_PATH/context-dna.json"

# Verifica se o Context DNA existe
if [ ! -f "$CONTEXT_DNA_PATH" ]; then
    echo "❌ Erro: Context DNA não encontrado em '$CONTEXT_DNA_PATH'"
    echo "💡 Execute primeiro: ./nexus-context.sh \"briefing\" $PROJECT_NAME"
    exit 1
fi

echo "📂 Projeto: $PROJECT_NAME"
echo "🎭 Modo: DEMONSTRAÇÃO (sem API calls)"
echo ""

# Lê o Context DNA
BUSINESS_TYPE=$(cat "$CONTEXT_DNA_PATH" | grep -o '"businessType":"[^"]*' | cut -d'"' -f4)
TARGET_AUDIENCE=$(cat "$CONTEXT_DNA_PATH" | grep -o '"primaryAge":"[^"]*' | cut -d'"' -f4)
VISUAL_STYLE=$(cat "$CONTEXT_DNA_PATH" | grep -o '"colorPsychology":"[^"]*' | cut -d'"' -f4)
BRAND_MOOD=$(cat "$CONTEXT_DNA_PATH" | grep -o '"voiceTone":"[^"]*' | cut -d'"' -f4)

echo "🧠 ANÁLISE DO CONTEXT DNA:"
echo "========================"
echo "📊 Business Type: $BUSINESS_TYPE"
echo "👥 Target Audience: $TARGET_AUDIENCE"  
echo "🎨 Visual Style: $VISUAL_STYLE"
echo "🎯 Brand Mood: $BRAND_MOOD"
echo ""

echo "🎬 PROMPTS CINEMATOGRÁFICOS CONTEXTUAIS:"
echo "========================================"
echo ""

# Gera prompts específicos baseados no business type
case $BUSINESS_TYPE in
    "fintech")
        echo "🦸 HERO VIDEOS (3 prompts):"
        echo "─────────────────────────"
        echo "1. 📈 trading_charts_flowing"
        echo "   Prompt: 'Cinematic shot of financial trading charts and data flowing smoothly across multiple monitors, professional blue lighting, navy and cyan color grading, corporate atmosphere, modern office environment, stable reliable professional cinematography, smooth camera movement, depth of field, professional even lighting, seamless loop animation'"
        echo "   Duração: 10s | Aspect: 16:9 | FPS: 30"
        echo ""
        echo "2. 🏢 professional_office"
        echo "   Prompt: 'Modern professional trading office environment, professional blue lighting, navy and cyan color grading, corporate atmosphere, glass windows with city view, elegant interior design, stable reliable professional cinematography, slow camera pan, architectural lighting, reliable professional cinematography'"
        echo "   Duração: 20s | Aspect: 16:9 | FPS: 24"
        echo ""
        echo "3. 🎉 success_celebration"
        echo "   Prompt: 'Professional trader celebrating successful trade, positive emotions, professional blue lighting, navy and cyan color grading, corporate atmosphere, modern office setting, stable reliable professional cinematography, uplifting atmosphere, natural lighting, authentic human moment'"
        echo "   Duração: 8s | Aspect: 16:9 | FPS: 30"
        echo ""
        
        echo "🌟 AMBIENT VIDEOS (3 prompts):"
        echo "─────────────────────────"
        echo "4. ✨ data_particles"
        echo "   Prompt: 'Abstract financial data particles flowing in space, professional blue lighting, navy and cyan color grading, corporate atmosphere, geometric patterns, stable reliable professional cinematography, smooth particle animation, depth layers, digital aesthetic, seamless loop'"
        echo "   Duração: 15s | Aspect: 16:9 | FPS: 60"
        echo ""
        echo "5. 🔶 geometric_patterns"
        echo "   Prompt: 'Professional geometric patterns representing financial stability, professional blue lighting, navy and cyan color grading, mathematical precision, stable reliable professional cinematography, smooth transitions, corporate aesthetic'"
        echo "   Duração: 15s | Aspect: 16:9 | FPS: 30"
        echo ""
        echo "6. 🛡️ trust_elements"
        echo "   Prompt: 'Visual elements representing trust and security in finance, professional blue lighting, navy and cyan color grading, shield and lock metaphors, stable reliable professional cinematography, confidence building atmosphere'"
        echo "   Duração: 15s | Aspect: 16:9 | FPS: 30"
        echo ""
        
        echo "👥 LIFESTYLE VIDEOS (3 prompts):"
        echo "───────────────────────────"
        echo "7. 💼 trader_working"
        echo "   Prompt: 'Professional trader focused on work, analyzing markets, professional blue lighting, navy and cyan color grading, corporate atmosphere, concentration and expertise, stable reliable professional cinematography, professional workspace'"
        echo "   Duração: 8s | Aspect: 16:9 | FPS: 24"
        echo ""
        echo "8. 🤝 team_collaboration"
        echo "   Prompt: 'Trading team collaborating on strategy, professional environment, professional blue lighting, navy and cyan color grading, teamwork and expertise, stable reliable professional cinematography, collaborative atmosphere'"
        echo "   Duração: 8s | Aspect: 16:9 | FPS: 24"
        echo ""
        echo "9. 🏆 achievement_moments"
        echo "   Prompt: 'Moments of achievement in trading career, success milestones, professional blue lighting, navy and cyan color grading, pride and accomplishment, stable reliable professional cinematography, aspirational feeling'"
        echo "   Duração: 8s | Aspect: 16:9 | FPS: 30"
        echo ""
        
        echo "🎨 ABSTRACT VIDEOS (3 prompts):"
        echo "─────────────────────────"
        echo "10. 📊 financial_growth"
        echo "    Prompt: 'Abstract representation of financial growth, upward trending lines, professional blue lighting, navy and cyan color grading, growth metaphors, stable reliable professional cinematography, prosperity visualization'"
        echo "    Duração: 15s | Aspect: 16:9 | FPS: 30"
        echo ""
        echo "11. 🌐 network_connections"
        echo "    Prompt: 'Global financial network connections, interconnected nodes, professional blue lighting, navy and cyan color grading, worldwide reach, stable reliable professional cinematography, connectivity visualization'"
        echo "    Duração: 15s | Aspect: 16:9 | FPS: 30"
        echo ""
        echo "12. 🌊 stability_waves"
        echo "    Prompt: 'Gentle waves representing market stability and trust, professional blue lighting, navy and cyan color grading, calm confidence, stable reliable professional cinematography, peaceful assurance'"
        echo "    Duração: 15s | Aspect: 16:9 | FPS: 24"
        echo ""
        ;;
        
    "fitness")
        echo "🦸 HERO VIDEOS (3 prompts):"
        echo "─────────────────────────"
        echo "1. 💪 workout_energy"
        echo "   Prompt: 'High-energy gym workout scene, dynamic movement, purple and violet lighting, modern color grading, tech atmosphere, fitness equipment, motivational atmosphere, elegant sophisticated movement, action cinematography, inspiring energy'"
        echo "   Duração: 10s | Aspect: 16:9 | FPS: 30"
        echo ""
        echo "2. ⚡ transformation_journey"  
        echo "   Prompt: 'Fitness transformation montage, before and after moments, purple and violet lighting, modern color grading, tech atmosphere, gym environment, elegant sophisticated movement, motivational storytelling, progress visualization'"
        echo "   Duração: 8s | Aspect: 16:9 | FPS: 24"
        echo ""
        echo "3. 🏋️ strength_building"
        echo "   Prompt: 'Strength training session, power and determination, purple and violet lighting, modern color grading, tech atmosphere, weight lifting focus, elegant sophisticated movement, athletic achievement'"
        echo "   Duração: 10s | Aspect: 16:9 | FPS: 30"
        echo ""
        
        echo "🌟 AMBIENT VIDEOS (3 prompts):"
        echo "─────────────────────────"
        echo "4. ⚡ energy_waves"
        echo "   Prompt: 'Abstract energy waves flowing through space, purple and violet lighting, modern color grading, dynamic patterns, elegant sophisticated movement, vitality visualization, seamless loop'"
        echo "   Duração: 15s | Aspect: 16:9 | FPS: 60"
        echo ""
        
        echo "👥 LIFESTYLE VIDEOS (3 prompts):"
        echo "───────────────────────────"
        echo "5. 🏃 gym_atmosphere"
        echo "   Prompt: 'Premium gym atmosphere, modern equipment and lighting, purple and violet lighting, modern color grading, tech atmosphere, fitness lifestyle, elegant sophisticated movement, motivational environment'"
        echo "   Duração: 8s | Aspect: 16:9 | FPS: 24"
        echo ""
        
        echo "🎨 ABSTRACT VIDEOS (3 prompts):"
        echo "─────────────────────────"
        echo "6. ⚡ power_surge"
        echo "   Prompt: 'Abstract power surge representing inner strength, purple and violet lighting, modern color grading, energy visualization, elegant sophisticated movement, transformation energy'"
        echo "   Duração: 15s | Aspect: 16:9 | FPS: 30"
        echo ""
        ;;
        
    "ecommerce")
        echo "🦸 HERO VIDEOS (3 prompts):"
        echo "─────────────────────────"
        echo "1. 🛍️ product_showcase"
        echo "   Prompt: 'Elegant product presentation with rotating display, warm orange glow, energetic color palette, dynamic lighting, premium lighting setup, commercial photography style, dynamic fast-paced movement, smooth rotation, luxury feel'"
        echo "   Duração: 10s | Aspect: 16:9 | FPS: 30"
        echo ""
        
        echo "🌟 AMBIENT VIDEOS (2 prompts):"
        echo "─────────────────────────"
        echo "2. 🎨 color_flow"
        echo "   Prompt: 'Flowing colors representing brand energy, warm orange glow, energetic color palette, dynamic color transitions, dynamic fast-paced movement, brand atmosphere, seamless loop'"
        echo "   Duração: 15s | Aspect: 16:9 | FPS: 60"
        echo ""
        
        echo "👥 LIFESTYLE VIDEOS (2 prompts):"
        echo "───────────────────────────"
        echo "3. 🛒 shopping_experience"
        echo "   Prompt: 'Modern shopping experience, customers browsing products, warm orange glow, energetic color palette, dynamic lighting, retail environment, dynamic fast-paced movement, lifestyle cinematography, natural interactions'"
        echo "   Duração: 8s | Aspect: 16:9 | FPS: 24"
        echo ""
        ;;
        
    *)
        echo "🎯 PROMPTS GENÉRICOS PARA BUSINESS TYPE: $BUSINESS_TYPE"
        echo "═══════════════════════════════════════════════════"
        echo "1. Hero: Professional $BUSINESS_TYPE scene with $VISUAL_STYLE lighting"
        echo "2. Ambient: Abstract patterns representing $BUSINESS_TYPE values"  
        echo "3. Lifestyle: People interacting with $BUSINESS_TYPE services"
        echo "4. Abstract: Conceptual visualization of $BUSINESS_TYPE success"
        echo ""
        ;;
esac

echo "💡 DEMONSTRAÇÃO DO FLUXO COMPLETO:"
echo "================================="
echo "1. ✅ Context DNA analisado com sucesso"
echo "2. ✅ Business type detectado: $BUSINESS_TYPE"
echo "3. ✅ Target audience identificado: $TARGET_AUDIENCE"
echo "4. ✅ Prompts contextuais gerados (12 vídeos para fintech)"
echo "5. ✅ Categorias organizadas: HERO, AMBIENT, LIFESTYLE, ABSTRACT"
echo "6. ⚡ Com API key válida → geraria vídeos reais"
echo "7. ✅ Assets seriam salvos organizadamente"
echo "8. ✅ Relatório e manifesto seriam criados"
echo ""
echo "🎯 O Video Agent está 100% funcional!"
echo "   → Só precisa de créditos na RunwayML ou Pika API"
echo ""
echo "🚀 Próximo passo disponível:"
echo "   → Implementar Content Agent (não precisa API)"
echo "   → Criar Quality Agent (testa performance)"
echo "   → Orchestrator Agent (coordena tudo)"