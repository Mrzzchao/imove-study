#!/bin/sh

git filter-branch --env-filter '

OLD_EMAIL="zhichazhang@tencent.com"
CORRECT_NAME="Mrzzchao"
CORRECT_EMAIL="mrzzhichao@gmail.com"

if [ "$GIT_COMMITTER_EMAIL" = "$CORRECT_EMAIL" ]
then
    export GIT_COMMITTER_NAME="$CORRECT_NAME"
    export GIT_COMMITTER_EMAIL="$CORRECT_EMAIL"
fi
if [ "$GIT_AUTHOR_EMAIL" = "$CORRECT_EMAIL" ]
then
    export GIT_AUTHOR_NAME="$CORRECT_NAME"
    export GIT_AUTHOR_EMAIL="$CORRECT_EMAIL"
fi
' --tag-name-filter cat -- --branches --tags
