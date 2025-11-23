#!/bin/bash

# Load environment variables from .env file
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Check if token is set
if [ -z "$GITHUB_TOKEN" ]; then
    echo "Error: GITHUB_TOKEN not set in .env file"
    echo "Please edit .env and add your token: GITHUB_TOKEN=your_token_here"
    exit 1
fi

echo "Using token (length: ${#GITHUB_TOKEN} characters)"

# Get the current remote URL
REMOTE_URL=$(git remote get-url origin)

# Extract the repository path (everything after github.com/)
REPO_PATH=$(echo $REMOTE_URL | sed 's|https://github.com/||' | sed 's|\.git$||')

# Temporarily update remote URL to include token, fetch, then restore
git remote set-url origin https://${GITHUB_TOKEN}@github.com/${REPO_PATH}.git
git fetch --all
git remote set-url origin https://github.com/${REPO_PATH}.git

# Show all branches
echo ""
echo "=== All Branches ==="
git branch -a

