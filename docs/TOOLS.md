# Built-in Tools

AgentSwarp comes with 14 built-in tools. No configuration needed -- just set the required env vars and your agents can use them.

| # | Tool | Name | Description | Required Env Vars |
|---|------|------|-------------|-------------------|
| 1 | HTTP Request | `http_request` | Make HTTP requests to any URL (GET, POST, PUT, DELETE, PATCH) | None |
| 2 | Send Email | `send_email` | Send emails via SMTP | `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` |
| 3 | Slack | `slack_message` | Send messages to Slack channels | `SLACK_BOT_TOKEN` |
| 4 | GitHub | `github` | Create issues, comment, manage files, list PRs | `GITHUB_TOKEN` |
| 5 | Notion | `notion` | Read/write Notion pages and databases | `NOTION_API_KEY` |
| 6 | Google Sheets | `google_sheets` | Read/write spreadsheets | `GOOGLE_SERVICE_ACCOUNT_KEY` |
| 7 | Discord | `discord` | Send messages via webhooks or bot | `DISCORD_BOT_TOKEN` (or webhook URL) |
| 8 | Telegram | `telegram` | Send messages/photos via bot | `TELEGRAM_BOT_TOKEN` |
| 9 | Twitter/X | `twitter` | Post tweets, search, get timelines | `TWITTER_BEARER_TOKEN` |
| 10 | Airtable | `airtable` | CRUD operations on Airtable bases | `AIRTABLE_API_KEY` |
| 11 | RSS Reader | `read_rss` | Fetch and parse RSS/Atom feeds | None |
| 12 | Web Scraper | `web_scrape` | Extract text from any webpage | None |
| 13 | Code Exec | `execute_code` | Run JavaScript/TypeScript snippets | None |
| 14 | Database | `query_database` | Run SQL on per-agent SQLite DB | None |

## Example Usage

### "Check Hacker News and post to Slack"

Agent goal: "Read the Hacker News RSS feed, find the top 5 stories, and post a summary to #news on Slack"

The agent will:
1. Use `read_rss` with `{"url": "https://hnrss.org/frontpage", "limit": 5}`
2. Use `slack_message` with `{"channel": "#news", "text": "Top 5 HN stories: ..."}`

### "Monitor a website for changes"

Agent goal: "Scrape example.com/pricing, compare with last run, alert me on Telegram if changed"

The agent will:
1. Use `web_scrape` with `{"url": "https://example.com/pricing"}`
2. Use `query_database` to get the last saved version
3. Compare the content
4. If changed: use `telegram` to send an alert
5. Use `query_database` to save the new version

### "Create a GitHub issue from an email"

Agent goal: "Read the latest unread email, create a GitHub issue with the subject as title and body as description"

The agent will:
1. Use `http_request` to check email (via API)
2. Use `github` with `{"action": "create_issue", "repo": "owner/repo", "title": "...", "body": "..."}`
