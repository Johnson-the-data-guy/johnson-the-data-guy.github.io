---
title: "I shipped CI/CD to production before I could explain it"
description: "A working pipeline and an understanding of that pipeline
  turn out to be different things."
date: 2026-09-17
kind: correction
tags: [ci-cd, github-actions, npm, yaml]
draft: false
---

I have a deployment pipeline running in production. It works. Push to
main, the app builds, the app deploys, and I have not thought about it
since.

Today I sat down to write another one from a blank file. I could not
explain a single line of the first one.

Not "I'd need to check the syntax." I did not know what the pieces
were.

## The three I could not defend

**`package-lock.json`.** I knew it existed, because it is in every repo
I have worked in, and I knew you were meant to commit it. I could not
have said why. `package.json` is a loose request — "version 7, or
anything later." The lockfile is the record of which versions you
actually got on the day it worked, down to the dependencies of your
dependencies. One is what you asked for. The other is what you
received.

**`npm ci` over `npm install`.** I had searched it once, found "use ci
in CI," and stopped. The real reason: `npm ci` deletes `node_modules`
and installs strictly from the lockfile, and it fails the build if the
lockfile and `package.json` disagree, instead of quietly resolving the
difference. A machine building your code should either reproduce what
you tested, or stop.

**`id-token: write`.** I copied this one in without knowing what it
did. I have a rough idea now — it lets the job ask GitHub for a signed
credential that the deploy target checks against a rule set in
advance, so no long-lived secret is stored anywhere. I would not try to
teach it yet. Writing it down as a line I carried around like a magic
word.

## What I was actually missing

The machine running the job is destroyed when the job ends. Every
build starts with an empty box — no code, no dependencies, not even
the language runtime.

Two jobs means two machines, and they never meet:

push to main
│
├── machine A ── fetch code
│ install runtime
│ install dependencies
│ build
│ upload output ──┐
│ (destroyed) │
│ ▼
│ storage
│ │
└── machine B ── fetch output ◄──┘
publish
(destroyed)


Once that lands, the rest stops being boilerplate. Fetching the code
is step one because there is no code. Installing the runtime is a step
because there is no runtime. The output has to go somewhere outside
both machines, because machine B has never seen machine A and never
will.

I had read all of those lines before. I read them as ceremony.

## YAML, which cost me an hour

No brackets. Indentation is the only thing saying what belongs to
what. Spaces only — a tab is a syntax error. A dash starts a list
item, and the space after it is not optional:

steps:

name: Install dependencies
run: npm ci

I wrote `-name`, without the space. Six times. YAML does not read that
as a list item with a name field. It reads `-name` as a key called
`-name`, which means nothing, and the file fails.

The file also has to live in `.github/workflows/`. I had it in the
project root. Nothing ran — no error, no warning, no failed run in the
Actions tab. GitHub never looked at it, so it had nothing to complain
about.

## Two things I would have got wrong yesterday

**Install and build are separate steps.** I would have merged them.
When the pipeline goes red you need to know which of the two broke —
a dependency that will not install and code that will not compile are
different problems.

**Permissions belong on each job, not at the top of the file.** The
build job only needs to read the repository. The deploy job needs to
publish, and does not need to read anything. One block at the top
hands both jobs everything, which is what most templates ship.

## The correction

A green tick told me my pipeline worked. I read it as though it had
told me I understood it.

Those are different claims, and only one of them was ever on the
screen.

The pipeline that deployed this site:
[github.com/Johnson-the-data-guy/Johnson-the-data-guy.github.io](https://github.com/Johnson-the-data-guy/Johnson-the-data-guy.github.io)
