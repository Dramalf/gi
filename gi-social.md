# gi-social — Claude Code Skill

A GitHub-based social media where every post is a git commit.
Web frontend: https://gi-social.vercel.app

---

## Authentication

You need a GitHub Personal Access Token with `public_repo` scope stored in `~/.gi/config.json`:

```json
{ "token": "ghp_...", "username": "your-github-username" }
```

If missing, ask the user:
> "I need a GitHub Personal Access Token with `public_repo` scope.
> Generate one at https://github.com/settings/tokens/new — check only **public_repo**."

Then save it and run `gi init` (or use the Direct API approach below to create the social repo).

---

## Two ways to operate

### Option A — gi CLI (if installed)

Check first: `which gi`

If not found, install:
```bash
git clone https://github.com/Dramalf/gi ~/.gi-social
cd ~/.gi-social && npm install && npm run build && npm link
```

Then use CLI commands (see below).

### Option B — Direct GitHub API (always available via curl)

All operations can be done by directly reading/writing files in the user's `social` repo on GitHub. Use `curl` with the GitHub REST API. This is the fallback when `gi` is not installed, or when you need fine-grained control.

Base URL: `https://api.github.com/repos/{username}/social`
Auth header: `Authorization: token {token}`

---

## All operations — CLI and direct API equivalents

### Read profile

**CLI:**
```bash
gi whoami
```

**Direct API:**
```bash
# Get profile.json from master branch
curl -s -H "Authorization: token TOKEN" \
  "https://api.github.com/repos/USERNAME/social/contents/profile.json?ref=master" \
  | python3 -c "import sys,json,base64; d=json.load(sys.stdin); print(base64.b64decode(d['content']).decode())"
```

---

### Update profile

**CLI:**
```bash
gi profile --name "Display Name" --bio "Bio" --website "https://..."
```

**Direct API:**
```bash
# 1. Get current SHA
SHA=$(curl -s -H "Authorization: token TOKEN" \
  "https://api.github.com/repos/USERNAME/social/contents/profile.json?ref=master" \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['sha'])")

# 2. Encode new content
CONTENT=$(echo '{"display_name":"Name","bio":"Bio","website":"https://...","created_at":"2024-01-01T00:00:00Z"}' | base64)

# 3. Push update
curl -s -X PUT -H "Authorization: token TOKEN" \
  -H "Content-Type: application/json" \
  "https://api.github.com/repos/USERNAME/social/contents/profile.json" \
  -d "{\"message\":\"update profile\",\"content\":\"$CONTENT\",\"sha\":\"$SHA\",\"branch\":\"master\"}"
```

---

### Post

**CLI:**
```bash
gi post "Hello world" --tags "hello,world"
gi post "Photo post" --media ./photo.jpg --tags "photo"
```

**Direct API** (create post manually):

A post lives at `posts/YYYY/MM/DD/HHmmss-slug/` on the `posts` branch and consists of two files:

1. `content.md` — the post body (markdown)
2. `post.json` — metadata: `{ "id", "tags", "media", "visibility", "created_at" }`

Plus you must append an entry to `index.json` on the `posts` branch.

```bash
# Variables
TOKEN="ghp_..."
USERNAME="yourusername"
SLUG="hello-world"
NOW=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
DATE=$(date -u +"%Y/%m/%d")
TIME=$(date -u +"%H%M%S")
PATH_PREFIX="posts/$DATE/${TIME}-${SLUG}"

# 1. Upload content.md
CONTENT_B64=$(echo "Hello world" | base64)
curl -s -X PUT -H "Authorization: token $TOKEN" \
  "https://api.github.com/repos/$USERNAME/social/contents/$PATH_PREFIX/content.md" \
  -d "{\"message\":\"post: $SLUG\",\"content\":\"$CONTENT_B64\",\"branch\":\"posts\"}"

# 2. Upload post.json
META=$(echo "{\"id\":\"${TIME}-${SLUG}\",\"tags\":[\"hello\"],\"media\":[],\"visibility\":\"public\",\"created_at\":\"$NOW\"}" | base64)
curl -s -X PUT -H "Authorization: token $TOKEN" \
  "https://api.github.com/repos/$USERNAME/social/contents/$PATH_PREFIX/post.json" \
  -d "{\"message\":\"post: $SLUG meta\",\"content\":\"$META\",\"branch\":\"posts\"}"

# 3. Update index.json — fetch current, append entry, push back
INDEX_RESP=$(curl -s -H "Authorization: token $TOKEN" \
  "https://api.github.com/repos/$USERNAME/social/contents/index.json?ref=posts")
INDEX_SHA=$(echo "$INDEX_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['sha'])")
NEW_INDEX=$(echo "$INDEX_RESP" | python3 -c "
import sys,json,base64
d=json.load(sys.stdin)
posts=json.loads(base64.b64decode(d['content']))
posts.insert(0,{'id':'${TIME}-${SLUG}','path':'$PATH_PREFIX','tags':['hello'],'media':[],'created_at':'$NOW','preview':'Hello world'})
print(base64.b64encode(json.dumps(posts).encode()).decode())
")
curl -s -X PUT -H "Authorization: token $TOKEN" \
  "https://api.github.com/repos/$USERNAME/social/contents/index.json" \
  -d "{\"message\":\"index: add ${SLUG}\",\"content\":\"$NEW_INDEX\",\"sha\":\"$INDEX_SHA\",\"branch\":\"posts\"}"
```

---

### Read feed / posts

**CLI:**
```bash
gi feed
gi feed --user someuser
gi feed --json --limit 10
```

**Direct API:**
```bash
# Read your own index.json (all posts, newest first)
curl -s -H "Authorization: token TOKEN" \
  "https://api.github.com/repos/USERNAME/social/contents/index.json?ref=posts" \
  | python3 -c "import sys,json,base64; d=json.load(sys.stdin); posts=json.loads(base64.b64decode(d['content'])); print(json.dumps(posts[:10], indent=2))"

# Read a specific post body
curl -s -H "Authorization: token TOKEN" \
  "https://api.github.com/repos/USERNAME/social/contents/PATH_TO_POST/content.md?ref=posts" \
  | python3 -c "import sys,json,base64; d=json.load(sys.stdin); print(base64.b64decode(d['content']).decode())"

# Read anyone's posts (no token needed for public repos)
curl -s "https://api.github.com/repos/OTHERUSERNAME/social/contents/index.json?ref=posts" \
  | python3 -c "import sys,json,base64; d=json.load(sys.stdin); print(base64.b64decode(d['content']).decode())"
```

---

### Follow / Unfollow

**CLI:**
```bash
gi follow someuser
gi unfollow someuser
gi following
```

**Direct API:**
```bash
# Read following.json
FOLLOW_RESP=$(curl -s -H "Authorization: token TOKEN" \
  "https://api.github.com/repos/USERNAME/social/contents/following.json?ref=master")
FOLLOW_SHA=$(echo "$FOLLOW_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['sha'])")

# Add a follower
NEW_FOLLOWING=$(echo "$FOLLOW_RESP" | python3 -c "
import sys,json,base64
d=json.load(sys.stdin)
arr=json.loads(base64.b64decode(d['content']))
if 'TARGET_USER' not in arr: arr.append('TARGET_USER')
print(base64.b64encode(json.dumps(arr).encode()).decode())
")

curl -s -X PUT -H "Authorization: token TOKEN" \
  "https://api.github.com/repos/USERNAME/social/contents/following.json" \
  -d "{\"message\":\"follow TARGET_USER\",\"content\":\"$NEW_FOLLOWING\",\"sha\":\"$FOLLOW_SHA\",\"branch\":\"master\"}"
```

---

## Data layout

```
github.com/<username>/social  (public repo)
├── master branch
│   ├── profile.json      ← { display_name, bio, avatar, website, created_at }
│   └── following.json    ← ["username1", "username2"]
└── posts branch
    ├── index.json        ← array of { id, path, tags, media, created_at, preview }
    └── posts/YYYY/MM/DD/HHmmss-<slug>/
        ├── content.md    ← post body (markdown)
        └── post.json     ← { id, tags, media[], visibility, created_at }
```

Media files live at:
`https://raw.githubusercontent.com/<username>/social/posts/<post-path>/media/<filename>`

index.json entry shape:
```json
{
  "id": "143022-hello-world",
  "path": "posts/2024/01/14/143022-hello-world",
  "tags": ["hello"],
  "media": ["media/photo.jpg"],
  "created_at": "2024-01-14T14:30:22Z",
  "preview": "First 200 chars of post..."
}
```

---

## Guided first-time setup flow

1. Check `~/.gi/config.json` — if missing, ask for GitHub token
2. Check if `social` repo exists: `GET https://api.github.com/repos/USERNAME/social`
3. If not: either run `gi init` or create repo + branches via API
4. Ask: "What would you like your first post to say?"
5. Post it (CLI or Direct API)
6. Confirm: "Posted! View it at https://gi-social.vercel.app"
