#!/bin/bash
echo "Testing gc alias components..."
echo "1. Git status:"
git status --short
echo ""
echo "2. Lumen location:"
which lumen
echo ""
echo "3. Config file:"
ls -la ~/.config/lumen/config.json
echo ""
echo "4. Testing lumen with config:"
lumen --config ~/.config/lumen/config.json draft
echo ""
echo "5. Full gc command:"
git add --all && lumen --config ~/.config/lumen/config.json draft