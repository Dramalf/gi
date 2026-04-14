# gi

GitHub-based social media. Every post is a git commit.

Your data lives in a GitHub repo you own. No database, no vendor lock-in.
The web frontend is at **https://gi-social.vercel.app**

## Quickstart with Claude Code

Clone this repo and open it in Claude Code — it will guide you through setup and your first post automatically.

```bash
git clone https://github.com/Dramalf/gi
cd gi
claude  # Claude Code reads CLAUDE.md and walks you through everything
```

## Manual setup

```bash
npm install
npm run build
npm link

# Authenticate (needs public_repo scope)
gi auth <your-github-token>

# Create your social repo on GitHub
gi init

# Post
gi post "Hello world" --tags "hello"
```

## Commands

```
gi auth <token>          Authenticate
gi init                  Create social repo
gi post "<text>"         Publish a post
  --tags "a,b"           Add tags
  --media <path>         Attach image or video
gi feed                  View your feed
gi follow <username>     Follow someone
gi whoami                Your profile
```

## How it works

Each user has a `social` repo on GitHub:

```
github.com/<you>/social
├── master  →  profile.json, following.json
└── posts   →  index.json, posts/YYYY/MM/DD/.../content.md
```

Posts are markdown files. Images are committed as binary files.
The feed is built by reading `index.json` from everyone you follow.
