#!/bin/bash

# Setup Turbo Remote Cache for Vercel
echo "Setting up Turbo Remote Cache..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Step 1: Authenticating with Vercel...${NC}"
npx turbo login

echo -e "${YELLOW}Step 2: Linking repository to team...${NC}"
echo "Please enter your Vercel team slug (e.g., 'slideheroes' or your username):"
read -p "Team slug: " TEAM_SLUG

# Create .turbo config directory if it doesn't exist
mkdir -p .turbo

# Create config.json with team information
cat > .turbo/config.json <<EOF
{
  "teamSlug": "$TEAM_SLUG"
}
EOF

echo -e "${GREEN}✓ Created .turbo/config.json with team: $TEAM_SLUG${NC}"

echo -e "${YELLOW}Step 3: Getting your Turbo token...${NC}"
echo "Run the following command to get your token:"
echo -e "${GREEN}npx turbo gen tokens${NC}"
echo ""
echo "Then add these secrets to your GitHub repository:"
echo "1. Go to: https://github.com/$(git remote get-url origin | sed 's/.*github.com[:/]\(.*\)\.git/\1/')/settings/secrets/actions"
echo "2. Add these secrets:"
echo "   - TURBO_TOKEN: <your-token-from-above>"
echo "   - TURBO_TEAM: $TEAM_SLUG"
echo ""

echo -e "${YELLOW}Step 4: Testing remote cache...${NC}"
echo "Once you've added the secrets, test with:"
echo -e "${GREEN}TURBO_TOKEN=<your-token> TURBO_TEAM=$TEAM_SLUG npx turbo build --filter=@kit/ui${NC}"
echo ""

echo -e "${GREEN}✓ Setup complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Generate and save your Turbo token"
echo "2. Add TURBO_TOKEN and TURBO_TEAM to GitHub secrets"
echo "3. Add TURBO_TOKEN to Vercel environment variables"
echo "4. Test the remote cache with a build"