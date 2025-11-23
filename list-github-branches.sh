#!/bin/bash

# Load environment variables from .env file
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Check if token is set
if [ -z "$GITHUB_TOKEN" ] || [ "$GITHUB_TOKEN" = "YOUR_TOKEN_HERE" ]; then
    echo "Error: GITHUB_TOKEN not set in .env file"
    echo "Please edit .env and replace YOUR_TOKEN_HERE with your actual token"
    exit 1
fi

# Get repository info
REPO_URL=$(git remote get-url origin)
REPO_OWNER=$(echo $REPO_URL | sed 's|https://github.com/||' | sed 's|\.git$||' | cut -d'/' -f1)
REPO_NAME=$(echo $REPO_URL | sed 's|https://github.com/||' | sed 's|\.git$||' | cut -d'/' -f2)

echo "Fetching branches from GitHub..."
echo "Repository: $REPO_OWNER/$REPO_NAME"
echo ""

# Use GitHub API to list branches
BRANCHES=$(curl -s -H "Authorization: token $GITHUB_TOKEN" \
    "https://api.github.com/repos/$REPO_OWNER/$REPO_NAME/branches")

if echo "$BRANCHES" | grep -q "message"; then
    echo "Error fetching branches:"
    echo "$BRANCHES" | grep -o '"message":"[^"]*"' | sed 's/"message":"\(.*\)"/\1/'
    exit 1
fi

echo "=== Branches on GitHub ==="
echo "$BRANCHES" | grep -o '"name":"[^"]*"' | sed 's/"name":"\(.*\)"/  - \1/' | sort

echo ""
echo "=== Fetching branches to local repository ==="
# Temporarily update remote URL to include token, fetch, then restore
ORIGINAL_URL=$(git remote get-url origin)
git remote set-url origin https://${GITHUB_TOKEN}@github.com/${REPO_OWNER}/${REPO_NAME}.git
git fetch --all --prune
git remote set-url origin "$ORIGINAL_URL"

echo ""
echo "=== All Local and Remote Branches ==="
git branch -a

