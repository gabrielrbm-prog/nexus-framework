#!/bin/bash
# NEXUS Code Agent v4 — Slot-Driven Assembly
# Usage: ./nexus-code-v4.sh <project-name>

WORKSPACE="$HOME/.openclaw/workspace/nexus-project"
AGENTS_DIR="$WORKSPACE/agents"
PROJECTS_DIR="$WORKSPACE/projects"

PROJECT="${1:?Usage: $0 <project-name>}"
PROJECT_DIR="$PROJECTS_DIR/$PROJECT"

if [ ! -d "$PROJECT_DIR" ]; then
  echo "Error: Project '$PROJECT' not found at $PROJECT_DIR"
  exit 1
fi

# Find context-dna.json
DNA_FILE=""
for f in "$PROJECT_DIR/context-dna.json" "$PROJECT_DIR/context_dna.json"; do
  if [ -f "$f" ]; then
    DNA_FILE="$f"
    break
  fi
done

if [ -z "$DNA_FILE" ]; then
  echo "Error: No context-dna.json found in $PROJECT_DIR"
  exit 1
fi

echo "NEXUS Code Agent v4 — Slot-Driven Assembly"
echo "Project: $PROJECT"
echo "DNA: $DNA_FILE"
echo ""

node "$AGENTS_DIR/nexus-code-agent-v4.js" "$DNA_FILE"
