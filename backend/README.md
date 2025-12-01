# Synka Backend API

Node.js + Express + TypeScript + PostgreSQL + Prisma backend for Synka Biosimilar Switch Kit.

## Prerequisites

- Node.js 18+
- PostgreSQL 15+
- npm or yarn

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env` and update values:

```bash
cp .env.example .env
```

Update the following in `.env`:
- `DATABASE_URL`: Your PostgreSQL connection string
- `JWT_SECRET`: A secure random string
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`: Your Twilio credentials

### 3. Setup database

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# (Optional) Open Prisma Studio to view database
npm run prisma:studio
```

### 4. Seed database (optional)

```bash
npm run seed
```

## Development

```bash
# Start development server with hot reload
npm run dev
```

Server runs on http://localhost:3000

## Production

```bash
# Build TypeScript
npm run build

# Start production server
npm start
```

## API Endpoints

### Health Check
- `GET /health` - Check server status

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user

### Patients
- `GET /api/v1/patients` - List patients
- `POST /api/v1/patients` - Create patient
- `GET /api/v1/patients/:id` - Get patient details
- `PUT /api/v1/patients/:id` - Update patient
- `DELETE /api/v1/patients/:id` - Delete patient

### Drugs
- `GET /api/v1/drugs` - List drugs
- `GET /api/v1/drugs/:id` - Get drug details

### Switches
- `POST /api/v1/switches` - Create biosimilar switch
- `GET /api/v1/switches` - List switches
- `GET /api/v1/switches/:id` - Get switch details
- `PUT /api/v1/switches/:id` - Update switch status

### Appointments
- `GET /api/v1/appointments` - List appointments
- `POST /api/v1/appointments` - Create appointment
- `PUT /api/v1/appointments/:id` - Update appointment

### Follow-ups
- `POST /api/v1/follow-ups` - Create follow-up record
- `GET /api/v1/follow-ups?appointmentId=` - Get follow-up

### SMS
- `POST /api/v1/sms/send` - Send SMS manually
- `POST /api/v1/sms/webhook` - Twilio delivery webhook

### Dashboard
- `GET /api/v1/dashboard/metrics` - Get program metrics
- `GET /api/v1/dashboard/recent-switches` - Get recent switches
- `GET /api/v1/dashboard/alerts` - Get alerts

### Sync
- `POST /api/v1/sync` - Sync offline data

## Project Structure

```
backend/
├── src/
│   ├── config/         # Configuration
│   ├── controllers/    # Request handlers
│   ├── middleware/     # Express middleware
│   ├── routes/         # API routes
│   ├── services/       # Business logic
│   ├── types/          # TypeScript types
│   ├── utils/          # Helper functions
│   └── index.ts        # App entry point
├── prisma/
│   └── schema.prisma   # Database schema
├── .env                # Environment variables
├── tsconfig.json       # TypeScript config
└── package.json        # Dependencies
```

## Database Schema

See [Prisma Schema](./prisma/schema.prisma) for complete data model.

Key entities:
- **User** - Staff, doctors, admins
- **Patient** - Patients receiving treatment
- **Drug** - Brand and biosimilar medications
- **SwitchRecord** - Biosimilar switch tracking
- **Appointment** - Scheduled visits
- **FollowUp** - Day-3 and Day-14 check-ins
- **SmsLog** - SMS delivery tracking
- **Alert** - Severe reaction alerts

## Technologies

- **Express** - Web framework
- **Prisma** - ORM
- **PostgreSQL** - Database
- **JWT** - Authentication
- **Bcrypt** - Password hashing
- **Twilio** - SMS sending
- **TypeScript** - Type safety

## License

MIT
