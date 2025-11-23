#!/bin/bash

# Simple script to test if token is set correctly
if [ -f .env ]; then
    source .env 2>/dev/null
fi

if [ -z "$GITHUB_TOKEN" ] || [ "$GITHUB_TOKEN" = "YOUR_TOKEN_HERE" ]; then
    echo "❌ Token not set!"
    echo ""
    echo "Please edit .env file and replace YOUR_TOKEN_HERE with your actual token"
    echo "The line should look like:"
    echo "GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
    exit 1
else
    echo "✅ Token found (length: ${#GITHUB_TOKEN} characters)"
    echo "Testing token..."
    
    # Test token with GitHub API
    RESPONSE=$(curl -s -H "Authorization: token $GITHUB_TOKEN" "https://api.github.com/user")
    
    if echo "$RESPONSE" | grep -q '"login"'; then
        USERNAME=$(echo "$RESPONSE" | grep -o '"login":"[^"]*"' | sed 's/"login":"\(.*\)"/\1/')
        echo "✅ Token is valid! Authenticated as: $USERNAME"
        echo ""
        echo "Now you can run: ./list-github-branches.sh"
    else
        echo "❌ Token is invalid or expired"
        echo "Response: $RESPONSE"
    fi
fi

