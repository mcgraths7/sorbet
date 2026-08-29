# `.claude/` — how the agent config is organised

This directory is version-controlled team config. It is reviewed like code,
because it changes what an agent does to the codebase.

## The three artifact types are not interchangeable

| Artifact | Loaded | Answers |
| --- | --- | --- |
| `CLAUDE.md` | **Always**, every turn | "Where am I, and what must never happen?" |
| `.claude/skills/<name>/SKILL.md` | Name + description always; **body only when invoked** | "How do I do this specific job?" |
| `.claude/agents/<name>.md` | Only when delegated to | "Go do this in your own context and report back" |

The distinction that matters: a **skill** runs in the current conversation and
changes how *this* agent proceeds. A **subagent** runs in a separate context
window and returns only its conclusion — use it for work whose intermediate
output you don't want (reading forty files to answer one question), or for
independent work you want done in parallel.

## Progressive disclosure — the whole point

Context is a budget. Everything resident costs tokens on *every* turn, whether
or not it is relevant. So the config is a ladder, cheapest tier first:

| Tier | What | Cost |
| --- | --- | --- |
| 1 | `CLAUDE.md` — the map and the non-negotiables | ~5.6 KB, always |
| 2 | Skill `name` + `description` | ~1.5 KB total, always |
| 3 | `SKILL.md` body | ~2–5 KB, only when that skill fires |
| 4 | Files a skill points at (`reference/*.md`) | ~5 KB, only when the body says to read them |

Measured in this repo:

```
always resident : 7.1 KB   (CLAUDE.md + six skill descriptions)
available       : 37.6 KB  (+ 30.5 KB of bodies, references and agent definition)
```

Before this restructuring, `CLAUDE.md` alone was 10.4 KB and carried the
procedures inline. The result: **32% less resident context, and 3.6× more total
guidance available.** A task that needs none of it pays 7.1 KB instead of
10.4 KB; a task that needs theme internals gets 3.4 KB of specifics that a
manual-style `CLAUDE.md` could never have afforded to keep loaded.

The saving is real but secondary. The bigger win is **precision**: the agent
reads the theme procedure when authoring a theme, and doesn't read it — or
half-remember it — when it isn't.

## Writing a skill

**The description is the router.** It is the only part the agent sees when
deciding whether to load the body, so it must state *when to use this*, not
what the skill contains. Include the trigger vocabulary someone would actually
use.

```yaml
# Good — routes on intent and symptoms
description: Diagnose a failing WCAG contrast gate — reading the build failure,
  finding which ramp step was chosen and why, and fixing it without weakening
  the accessibility contract. Use when pnpm build fails on contrast.

# Bad — describes contents, routes on nothing
description: Information about colours and accessibility.
```

**The body is a procedure, not an essay.** Order of operations, the files it
touches, the verification command. Say what the gates are so the agent can
confirm its own work instead of declaring success.

**Include the reasoning behind constraints.** "Never lower a `min` in
`rules.ts`" is a rule an agent will route around under pressure. "…because the
rule encodes a legal requirement; lowering it doesn't make the checkbox
visible, it makes the build stop mentioning that it isn't" is one it will hold.

**Push bulk into tier 4.** Big tables, exhaustive maps and generated data go in
files the body points at. `sorbet-classes` is the example: the SKILL.md holds
the judgment (which element gets which class, and the ordering rules), and the
76-block exhaustive tables sit in `reference/` and load only if needed.

**Generate derived data, don't hand-maintain it.** `sorbet-classes/refresh.py`
rebuilds those tables from the Sass partials. A hand-written class map drifts,
and a stale map is worse than none — it makes the agent confidently apply
classes that no longer exist.

## Granularity and composition

Skills are deliberately narrow so they combine. Adding a themed component is
`add-component` + `author-theme` + `ship-change`, each loaded only if that part
of the work actually comes up. One fat `contributing` skill would force all
three into context to get any one of them — which is the same failure mode as
putting everything in `CLAUDE.md`, just one level down.

Rule of thumb: **if two halves of a skill are never needed on the same task,
they are two skills.** Conversely, if you find yourself always invoking two
together, merge them.

## Adding one

```
.claude/skills/<kebab-name>/
  SKILL.md          # frontmatter: name, description. Body: the procedure.
  reference/*.md    # optional tier-4 bulk
  *.py|*.sh         # optional helpers the body invokes
```

Then add a row to the task router in `CLAUDE.md`, and — if the skill
supersedes prose currently sitting in `CLAUDE.md` — **delete that prose**.
Leaving both is the most common way this pattern degrades: the index grows back
into a manual and the resident cost returns.

## Anti-patterns

- **A skill that restates `CLAUDE.md`.** Duplication means the agent pays twice
  and the two drift apart.
- **A description that only makes sense if you already know the codebase.** It
  is a routing key for someone who doesn't.
- **A skill nobody can invoke by accident.** If you cannot imagine the sentence
  a person types that should trigger it, the description is wrong.
- **Procedures in `CLAUDE.md`.** If it is step-by-step, it belongs in a skill.
- **Untested helper scripts.** A helper that errors mid-skill is worse than no
  helper; the agent will improvise around it.

## Portability

`CLAUDE.md` is the Claude Code convention; `AGENTS.md` is the vendor-neutral
equivalent other tools read. The structure here — thin always-loaded index,
narrow on-demand procedures, bulk behind a pointer — is the portable part.
If a repo needs both, make one a symlink to the other rather than maintaining
two copies that disagree.
