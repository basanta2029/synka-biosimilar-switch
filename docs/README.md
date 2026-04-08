# Synka - Biosimilar Switch Kit MVP

Healthcare mobile application for managing biosimilar medication switches in emerging markets.

## Project Structure

```
synka/
├── mobile/          # React Native Android app
├── backend/         # Node.js + Express API server
├── web/            # Admin dashboard (React)
└── docs/           # Documentation & PRD
```

## Tech Stack

### Mobile (Android)
- React Native 0.72+
- TypeScript
- React Navigation
- SQLite (offline-first)
- React Query

### Backend
- Node.js 18+
- Express + TypeScript
- PostgreSQL
- Prisma ORM
- JWT Authentication
- Twilio (SMS)

### Web Dashboard
- React 18+
- TypeScript
- Tailwind CSS

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- Android Studio (for mobile development)
- Twilio account (for SMS)

### Setup

See individual README files in each directory:
- [Backend Setup](./backend/README.md)
- [Mobile Setup](./mobile/README.md)
- [Web Setup](./web/README.md)

## Team

- Simon Armstrong - Scrum Leader
- Cameron Carter - Technical Lead
- Basanta Baral - Backend Development
- Sollomon Crowder - Frontend Engineer
- Destin Gilbert - Frontend Engineer

## Documentation

- [Product Requirements Document (PRD)](./docs/PRD_Synka_MVP.md)

## License

Copyright © 2024 Howard University Senior Project Team
