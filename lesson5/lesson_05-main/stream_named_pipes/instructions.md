# Exercise: Named Pipes in Bash

A **named pipe** lets one process send information to another process.

In this exercise, we will build a tiny newsroom:

```text
REPORTER 1 ─┐
REPORTER 2 ─┼──> newsroom ──> EDITOR
REPORTER 3 ─┘
```

The reporters write headlines into a pipe.

The editor waits for headlines and prints them as they arrive.

## 1. Create the editor

Create a file called:

```text
editor.sh
```

Add:

```bash
#!/bin/bash

PIPE=newsroom

mkfifo "$PIPE"
trap 'rm -f "$PIPE"' EXIT

while true; do
    read headline < "$PIPE"
    echo "📰 $headline"
done
```

Make it executable:

```bash
chmod +x editor.sh
```

Run it:

```bash
./editor.sh
```

Nothing happens.

The editor is **waiting for data**.

## 2. Send a headline

Open another terminal.

Run:

```bash
echo "AI discovers coffee" > newsroom
```

The editor receives:

```text
📰 AI discovers coffee
```

Try another:

```bash
echo "MIT replaces homework with robots" > newsroom
```

And another:

```bash
echo "Students demand four-day weekend" > newsroom
```

The editor prints each headline as it arrives.

## 3. What is happening?

This command:

```bash
mkfifo newsroom
```

creates the named pipe.

This command:

```bash
echo "AI discovers coffee" > newsroom
```

writes data into the pipe.

This command:

```bash
read headline < "$PIPE"
```

reads data from the pipe.

The pipe connects otherwise independent processes:

```text
echo → pipe → read
```

The writer waits for a reader.

The reader waits for a writer.

The operating system coordinates the communication.

## 4. Cleaning up

When you stop the editor with:

```text
Ctrl+C
```

this line:

```bash
trap 'rm -f "$PIPE"' EXIT
```

automatically deletes the pipe.

You can also delete it manually:

```bash
rm newsroom
```

## The Big Idea

A named pipe is a simple communication channel between processes.

Today:

```text
Reporter → Pipe → Editor
```

Later:

```text
Agent 1 ─┐
Agent 2 ─┼──> Pipe ──> Orchestrator
Agent 3 ─┘
```

The mechanism stays almost exactly the same.