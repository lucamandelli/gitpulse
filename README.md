# GitPulse

> AI-powered GitHub repository monitor that summarizes commits in natural language and delivers real-time notifications.

GitPulse watches your GitHub repositories in the background and uses an LLM to turn raw diffs into readable summaries — telling you what changed, why it matters, and what to watch out for.

---

## Status

🚧 Under active development — not functional yet.

---

## Motivation

This is a personal learning project. The goal is to build something useful while exploring technologies I've never worked with before: message queues, real-time WebSocket notifications, and LLM integration.

---

## Planned stack

| Layer       | Technology                |
| ----------- | ------------------------- |
| API         | NestJS                    |
| Worker      | NestJS microservice       |
| Frontend    | React + TypeScript + Vite |
| Database    | PostgreSQL + TypeORM      |
| Queues      | BullMQ + Redis            |
| AI          | OpenAI gpt-4o-mini        |
| Local infra | Docker Compose            |