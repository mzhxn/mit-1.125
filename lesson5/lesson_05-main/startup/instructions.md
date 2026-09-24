I’d make it a **creative transformation pipeline** so the effect of piping is obvious.

1. **`1_idea.sh` → Generate**
   - Codex: “Invent a ridiculous but plausible AI startup. Describe it in 3 short lines.”
2. **`2_improve.sh` → Transform**
   - Takes stdin.
   - Codex: “Take this startup idea and make it dramatically better. Clarify the customer, product, and why anyone would pay for it.”
3. **`3_pitch.sh` → Compress**
   - Takes stdin.
   - Codex: “Turn this into one punchy one-sentence investor pitch. Output only the sentence.”

Then:

```bash
./1_idea.sh | ./2_improve.sh | ./3_pitch.sh
```

So the conceptual pattern stays exactly like your minimalist example:

**Generate → Transform → Summarize**

Except now each pipe connects one AI agent to the next. That is a very clean bridge from Unix piping to agentic workflows.



----------



Make them executable:

```bash
chmod +x 1_idea.sh 2_improve.sh 3_slides.sh
```

Then the entire AI workflow is simply:

```bash
./1_idea.sh | ./2_improve.sh | ./3_slides.sh
```

Conceptually, it is still beautifully simple:

**Generate → Improve → Present**

Each program knows nothing about the others. It simply **receives text, does work, and sends text onward**. That is the lesson I would emphasize.