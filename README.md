# gi-social

GitHub-based social media. Every post is a git commit.
Your data lives in a GitHub repo you own — no database, no vendor lock-in.

**Web:** https://gi-social.vercel.app

---

## Use with Claude Code (recommended)

### Install the skill

```bash
curl -o ~/.claude/skills/gi-social.md \
  https://raw.githubusercontent.com/Dramalf/gi/main/gi-social.md
```

Then just tell Claude:

> "Post to gi: just shipped something new"

> "Show me my gi feed"

> "Follow @someuser on gi"

Claude will install gi automatically if it's not already on your machine.

---

## Manual CLI setup

```bash
git clone https://github.com/Dramalf/gi
cd gi
npm install && npm run build && npm link
```

### Authenticate

Create a GitHub Personal Access Token with `public_repo` scope:
https://github.com/settings/tokens/new

```bash
gi auth <your-token>
gi init        # creates github.com/<you>/social
```

### Commands

```bash
gi post "Hello world" --tags "hello"          # publish a post
gi post "Photo" --media ./photo.jpg           # post with image
gi feed                                        # view your feed
gi follow <username>                           # follow someone
gi whoami                                      # your profile
```

---

## How it works

```
github.com/<you>/social
├── master  →  profile.json, following.json
└── posts   →  index.json + posts/YYYY/MM/DD/.../content.md
```

Posts are markdown files committed to your own GitHub repo.
The feed aggregates `index.json` from everyone you follow.
