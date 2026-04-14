# gi — Claude Code Skill

You are helping the user set up and use **gi**, a GitHub-based social media CLI where every post is a git commit.

## What gi does

- Each user owns a GitHub repo named `social` with two branches:
  - `master` — profile info (`profile.json`, `following.json`)
  - `posts` — all posts + `index.json`
- Posts are markdown files committed directly to GitHub. No external database.
- The web frontend lives at https://gi-social.vercel.app

## Setup (run this automatically on first interaction)

### Step 1 — Install dependencies

```bash
npm install
npm run build
npm link
```

### Step 2 — Check authentication

```bash
cat ~/.gi/config.json
```

If the file doesn't exist, the user needs to authenticate. Guide them:

> "To get started, you need a GitHub Personal Access Token.
> 1. Go to https://github.com/settings/tokens/new
> 2. Set Note to `gi`
> 3. Check **`public_repo`** scope only
> 4. Click Generate token and paste it here"

Once you have the token, run:

```bash
gi auth <token>
```

### Step 3 — Initialize social repo

```bash
gi init
```

This creates `github.com/<username>/social` with the correct branch structure.
If the repo already exists, this is safe to re-run.

### Step 4 — First post

Ask the user: **"What would you like your first post to say?"**

Then run:

```bash
gi post "<their content>" --tags "<relevant,tags>"
```

To attach an image:

```bash
gi post "<content>" --media /path/to/image.jpg --tags "<tags>"
```

Confirm success and share the web URL:
> "Posted! View your feed at https://gi-social.vercel.app"

---

## All available commands

| Command | Description |
|---------|-------------|
| `gi auth <token>` | Authenticate with GitHub PAT (`public_repo` scope) |
| `gi init` | Create and initialize the social repo |
| `gi post "<content>"` | Publish a post |
| `gi post "<content>" --tags "a,b"` | Post with tags |
| `gi post "<content>" --media <path>` | Post with image/video (comma-separate for multiple) |
| `gi feed` | Show latest posts from people you follow |
| `gi feed --json` | Feed as JSON (for agent processing) |
| `gi feed --user <username>` | Show a specific user's posts |
| `gi follow <username>` | Follow a user |
| `gi unfollow <username>` | Unfollow a user |
| `gi following` | List who you follow |
| `gi whoami` | Show your profile |
| `gi profile --name "..." --bio "..."` | Update profile |

## Post format

Content is stored as plain markdown. Use markdown freely:

```
gi post "## Big news

Just launched something.

Check it out at [link](https://example.com)

**Key features:**
- Fast
- Simple" --tags "launch,product"
```

## Data layout (for reference)

```
github.com/<username>/social
├── master branch
│   ├── profile.json        ← display name, bio, avatar, website
│   └── following.json      ← array of GitHub usernames
└── posts branch
    ├── index.json          ← full post index, read this to understand a user's content
    └── posts/YYYY/MM/DD/HHmmss-<slug>/
        ├── content.md      ← post body (markdown)
        └── post.json       ← metadata (id, tags, media, visibility)
```

## Guided onboarding flow

When a user first opens this repo in Claude Code, run through this sequence automatically:

1. Run `npm install && npm run build && npm link` silently
2. Check `~/.gi/config.json` — if missing, ask for GitHub token and run `gi auth`
3. Run `gi init` to set up their social repo
4. Ask what they want their first post to say
5. Post it with `gi post`
6. Tell them to visit https://gi-social.vercel.app to see it live
