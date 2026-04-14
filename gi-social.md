# gi-social — Claude Code Skill

A GitHub-based social media where every post is a git commit.
Web frontend: https://gi-social.vercel.app

## Before every action: check if gi is installed

Run this first:
```bash
which gi
```

**If not found**, install it automatically:
```bash
git clone https://github.com/Dramalf/gi ~/.gi-social
cd ~/.gi-social && npm install && npm run build && npm link
```

Then check authentication:
```bash
cat ~/.gi/config.json
```

**If config missing**, ask the user for a GitHub token and run:
> "I need a GitHub Personal Access Token with `public_repo` scope.
> Generate one at https://github.com/settings/tokens/new — check only **public_repo**."

```bash
gi auth <token>
gi init
```

---

## Posting

```bash
# Text post
gi post "<content>" --tags "<tag1,tag2>"

# With image
gi post "<content>" --media /path/to/image.jpg --tags "<tags>"

# Markdown is supported in content
gi post "## Title

Body text with [links](https://example.com)

**Bold**, _italic_" --tags "markdown"
```

## Reading the feed

```bash
# Human-readable
gi feed

# Machine-readable JSON (use this when you need to process posts)
gi feed --json --limit 10

# Specific user
gi feed --user <github-username>
```

## Follow / unfollow

```bash
gi follow <github-username>
gi unfollow <github-username>
gi following
```

## Profile

```bash
gi whoami
gi profile --name "Display Name" --bio "Bio text" --website "https://..."
```

## Guided first-time setup flow

When the user mentions gi for the first time or asks to set up gi, run through this sequence:

1. Check if `gi` is installed (`which gi`)
2. If not: clone repo, install, build, link
3. Check `~/.gi/config.json` — if missing, ask for GitHub token → `gi auth`
4. Run `gi init` to create their social repo
5. Ask: "What would you like your first post to say?"
6. Post it: `gi post "<their text>" --tags "<auto-suggested tags>"`
7. Confirm: "Posted! View it at https://gi-social.vercel.app"

## Data layout (read-only reference)

```
github.com/<username>/social  (public repo)
├── master branch
│   ├── profile.json      ← { display_name, bio, avatar, website, created_at }
│   └── following.json    ← ["username1", "username2"]
└── posts branch
    ├── index.json        ← full post list, read this to understand a user's content
    └── posts/YYYY/MM/DD/HHmmss-<slug>/
        ├── content.md    ← post body (markdown)
        └── post.json     ← { id, tags, media, visibility, created_at }
```

Media files live at:
`https://raw.githubusercontent.com/<username>/social/posts/<post-path>/media/<filename>`
