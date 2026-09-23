---
name: Build workflow
description: Spec-first workflow, verification rules, commit and code conventions for this repo
inclusion: always
---

# How work is done in this repository

These conventions apply to every task in this repo. Follow them without being asked.

## Spec before code

- No implementation starts without an approved spec under `.kiro/specs/<feature>/`.
- `requirements.md` uses EARS-style criteria (`WHEN ... THE SYSTEM SHALL ...`) and every requirement
  has a stable ID (`R1`, `R2`, ...).
- `design.md` maps each requirement to the component that satisfies it and lists the properties the
  implementation must hold. Properties are written as universally quantified statements that can be
  checked by a generator, not as example tables.
- `tasks.md` is the only source of work items. Each task references the requirement IDs it
  satisfies. If a change is not traceable to a requirement, the requirement is updated first.

## Verification is part of the task, not a follow-up

- A task is done when its tests pass and the output is committed in the same commit as the code.
- Prefer property-based tests for anything with an input space: state the property, let the
  generator search, and keep the shrunk counterexample in the failure output.
- Example-based tests are for exact expected values and error messages only.

## Commits

- One logical change per commit. The message states what changed and why, in the imperative mood.
- Never commit `.env`, credentials, tokens, or anything generated from them.
- Do not rewrite history on a branch that has been pushed.

## Code

- Small modules with one responsibility; no file grows past ~300 lines without being split.
- No dead code, no commented-out blocks, no placeholder implementations: if something is not built
  yet, it is not in the repo.
- Every public function has a short comment stating the contract (inputs, outputs, failure mode).

## Documentation

- The README states what the project does, how to run it, and how to run the tests. It stays true:
  a change that alters behaviour updates the README in the same commit.
