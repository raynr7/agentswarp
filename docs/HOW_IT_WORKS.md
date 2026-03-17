# How AgentSwarp Works

AgentSwarp uses a simple loop called **ReAct** (Reason + Act) to automate tasks. Here's what happens when you run an agent:

## The Loop

1. **You write a goal** in plain English
   Example: "Check my RSS feeds and send a summary to Slack"

2. **AgentSwarp sends it to an AI model**
   The AI reads your goal and thinks about what to do first

3. **The AI decides which tool to use**
   "I should use the RSS reader to fetch the latest articles"

4. **The tool runs**
   AgentSwarp calls the RSS tool, fetches the feed, and gets results

5. **The AI sees the result and decides what's next**
   "Now I have 5 articles. Let me summarize them and send to Slack"

6. **Repeat until done**
   Steps 3-5 repeat until the AI decides the task is complete

## Diagram

```
                  +------------------+
                  |   Your Goal      |
                  |  (plain English) |
                  +--------+---------+
                           |
                           v
                  +------------------+
            +-----|   AI Thinks      |-----+
            |     |  "What should I  |     |
            |     |   do next?"      |     |
            |     +--------+---------+     |
            |              |               |
            |              v               |
            |     +------------------+     |
            |     |   Pick a Tool    |     |
            |     |  (HTTP, Slack,   |     |
            |     |   Email, etc.)   |     |
            |     +--------+---------+     |
            |              |               |
            |              v               |
            |     +------------------+     |
            |     |   Run the Tool   |     |
            |     |  (real action!)  |     |
            |     +--------+---------+     |
            |              |               |
            |              v               |
            +-----|   See Results    |-----+
                  |  "Did it work?   |
                  |   What's next?"  |
                  +--------+---------+
                           |
                     Done? v Yes
                  +------------------+
                  |   Final Answer   |
                  |  + Summary       |
                  +------------------+
```

## Key Concepts

- **Agent**: A named automation with a goal and instructions
- **Run**: One execution of an agent (a single loop from start to finish)
- **Step**: One action within a run (thought, tool call, or result)
- **Tool**: Something the agent can do (send email, read RSS, call API)
- **Memory**: Data the agent remembers between runs

## Safety

- Maximum 15 steps per run (prevents infinite loops)
- Each tool has input validation
- Code execution is sandboxed
- Agents can only use tools you've configured
- All actions are logged in the run history
