#!/bin/bash
set -e

echo "Step 1: Checking current git status and branches"
git status
git branch

echo "Step 2: Creating a new orphan branch (no history)"
git checkout --orphan new-main

echo "Step 3: Adding all files except memory-bank/ and .clinerules"
git add .
git reset -- memory-bank/ .clinerules
git status

echo "Step 4: Committing changes"
git commit -m "Initial commit with clean repository (no memory bank files or .clinerules)"

echo "Step 5: Listing all branches"
git branch -a

echo "Step 6: Renaming new-main to main"
git branch -m new-main main

echo "Step 7: Forcing push to origin main"
git push -f origin main

echo "Step 8: Fetching all branches"
git fetch --all

echo "Step 9: Listing all remote branches"
git branch -r

echo "Step 10: Deleting all other remote branches"
for branch in $(git branch -r | grep -v 'origin/main' | sed 's/origin\///'); do
  echo "Deleting remote branch: $branch"
  git push origin --delete $branch
done

echo "Step 11: Verifying final state"
git branch -a
git status

echo "Cleanup complete!"
