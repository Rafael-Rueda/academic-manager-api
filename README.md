# Academic Manager API

A modern academic management API built with **Node.js**, **Fastify**, and **TypeScript**. This application provides a robust foundation for managing academic courses, user authentication, and enrollment systems with email verification capabilities.

## 🚀 Features

- **User Management**: Registration and authentication with email confirmation
- **Course Management**: Full CRUD operations for academic courses
- **Enrollment System**: User enrollment in courses with unique constraints
- **Email Verification**: Secure email-based authentication with confirmation codes
- **JWT Authentication**: Stateless authentication using JSON Web Tokens
- **API Documentation**: Auto-generated documentation with Swagger UI and Scalar
- **Database Migrations**: Version-controlled database schema management
- **Comprehensive Testing**: Unit and integration tests with coverage reporting
- **Modern Development**: Hot reload, linting, and type safety

## 📦 Dependencies & Technologies

### **Core Runtime Dependencies**
| Package | Version | Purpose | Documentation |
|---------|---------|---------|---------------|
| `fastify` | ^5.5.0 | Fast and low overhead web framework | [docs](https://fastify.dev/) |
| `drizzle-orm` | ^0.44.4 | TypeScript-first ORM with excellent developer experience | [docs](https://orm.drizzle.team/) |
| `fastify-type-provider-zod` | ^5.0.3 | Zod integration for Fastify with type safety | [docs](https://github.com/turkerdev/fastify-type-provider-zod) |
| `jsonwebtoken` | ^9.0.2 | JWT implementation for Node.js authentication | [docs](https://github.com/auth0/node-jsonwebtoken) |
| `nodemailer` | ^7.0.5 | Email sending functionality | [docs](https://nodemailer.com/) |
| `pg` | ^8.16.3 | PostgreSQL client for Node.js | [docs](https://node-postgres.com/) |
| `zod` | ^4.0.17 | TypeScript-first schema validation | [docs](https://zod.dev/) |
| `pino-pretty` | ^13.1.1 | Pretty logging for development | [docs](https://github.com/pinojs/pino-pretty) |

### **API Documentation**
| Package | Version | Purpose | Documentation |
|---------|---------|---------|---------------|
| `@fastify/swagger` | ^9.5.1 | OpenAPI documentation generation | [docs](https://github.com/fastify/fastify-swagger) |
| `@fastify/swagger-ui` | ^5.2.3 | Swagger UI integration for Fastify | [docs](https://github.com/fastify/fastify-swagger-ui) |
| `@scalar/fastify-api-reference` | ^1.34.2 | Modern API documentation with Scalar | [docs](https://github.com/scalar/scalar) |

### **Development Dependencies**
| Package | Version | Purpose | Documentation |
|---------|---------|---------|---------------|
| `typescript` | ^5.9.2 | Type-safe JavaScript development | [docs](https://www.typescriptlang.org/) |
| `@types/node` | ^24.2.1 | TypeScript definitions for Node.js | [docs](https://www.npmjs.com/package/@types/node) |
| `@types/jsonwebtoken` | ^9.0.10 | TypeScript definitions for jsonwebtoken | [docs](https://www.npmjs.com/package/@types/jsonwebtoken) |
| `@types/nodemailer` | ^7.0.0 | TypeScript definitions for nodemailer | [docs](https://www.npmjs.com/package/@types/nodemailer) |
| `@types/supertest` | ^6.0.3 | TypeScript definitions for supertest | [docs](https://www.npmjs.com/package/@types/supertest) |
| `drizzle-kit` | ^0.31.4 | CLI companion for schema management and migrations | [docs](https://orm.drizzle.team/kit-docs/overview) |
| `dotenv-cli` | ^10.0.0 | Environment variable management | [docs](https://github.com/entropitor/dotenv-cli) |

### **Code Quality & Linting**
| Package | Version | Purpose | Documentation |
|---------|---------|---------|---------------|
| `@biomejs/biome` | ^2.1.4 | Fast formatter and linter for JavaScript/TypeScript | [docs](https://biomejs.dev/) |
| `@rueda.dev/config` | ^1.1.3 | Shared configuration for Biome and other tools | [docs](https://www.npmjs.com/package/@rueda.dev/config) |

### **Testing Framework**
| Package | Version | Purpose | Documentation |
|---------|---------|---------|---------------|
| `vitest` | ^3.2.4 | Fast unit testing framework | [docs](https://vitest.dev/) |
| `@vitest/coverage-v8` | ^3.2.4 | Code coverage reporting with V8 | [docs](https://vitest.dev/guide/coverage.html) |
| `supertest` | ^7.1.4 | HTTP testing library | [docs](https://github.com/ladjs/supertest) |
| `@faker-js/faker` | ^9.9.0 | Test data generation | [docs](https://fakerjs.dev/) |

### **Database**
| Package | Version | Purpose | Documentation |
|---------|---------|---------|---------------|
| `PostgreSQL` | 17 | Advanced open source relational database | [docs](https://www.postgresql.org/) |
| `Docker` | Latest | Containerization for database services | [docs](https://www.docker.com/) |

**Package Manager & Runtime Requirements:**
- **Node.js**: v18+ (LTS recommended)
- **npm**: Latest version
- **Docker**: For database services

## 📋 Prerequisites

- **[Node.js](https://nodejs.org/)** (v18+ recommended)
- **[Docker](https://www.docker.com/)** and **Docker Compose** (for database)
- **[Git](https://git-scm.com/)** for version control

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd academic-manager
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Create environment files based on your needs:

```bash
# Main environment file
cp .env.example .env

# Test environment file (optional)
cp .env.example .env.test
```

### 4. Configure Environment Variables

Edit your `.env` file with the following variables:

```env
# Application
NODE_ENV=development
PORT=3333

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/academic_manager

# Authentication
JWT_SECRET=your-super-secure-jwt-secret-here

# Frontend
FRONTEND_URL=http://localhost:3000

# Email Configuration
EMAIL_USER=your-email@example.com
EMAIL_PASSWORD=your-app-password
```

### 5. Start Database Services

```bash
# Start PostgreSQL containers
docker-compose up -d

# For testing database (optional)
docker-compose up -d db-test
```

### 6. Run Database Migrations

```bash
# Generate and run migrations
npm run db:makemigrations
npm run db:migrate

# Optional: Seed database with sample data
npm run db:seed
```

### 7. Start Development Server

```bash
npm run dev
```

The API will be available at `http://localhost:3333`

## 📖 API Documentation

When running in development mode, comprehensive API documentation is available at:

- **Scalar UI**: `http://localhost:3333/docs` (Modern, interactive documentation)
- **Swagger UI**: Available through Fastify Swagger integration

### Authentication Flow

1. **Register**: `POST /auth/register` - Create account with email/name
2. **Login**: `POST /auth/login` - Request confirmation code via email
3. **Verify**: `POST /auth/verify` - Confirm email with 6-digit code
4. **Access**: Use returned JWT token in Authorization header

### Main Endpoints

#### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - Login request (sends email confirmation)
- `POST /auth/verify` - Email verification

#### Courses
- `GET /courses` - List courses (with search, pagination, sorting)
- `POST /courses` - Create new course
- `GET /courses/:id` - Get course details

*Note: All course endpoints require authentication*

## 🗄️ Database Schema

### Users
- `id` (UUID, Primary Key)
- `name` (Text, Required)
- `email` (Text, Unique, Required)
- `confirmed` (Boolean, Default: false)
- `createdAt` (Timestamp)

### Courses
- `id` (UUID, Primary Key)
- `title` (Text, Unique, Required)
- `description` (Text, Optional)
- `price` (Integer, Optional)

### Enrollments
- `id` (UUID, Primary Key)
- `userId` (UUID, Foreign Key → Users)
- `courseId` (UUID, Foreign Key → Courses)
- `createdAt` (Timestamp)
- Unique constraint: One enrollment per user per course

### Email Confirmation Codes
- `id` (UUID, Primary Key)
- `userId` (UUID, Foreign Key → Users)
- `code` (Text, 6-digit confirmation code)
- `expiresAt` (Timestamp)
- `used` (Boolean, Default: false)
- `createdAt` (Timestamp)

## ⚡ Available Scripts

```bash
# Development
npm run dev              # Start development server with hot reload

# Database Operations
npm run db:studio        # Open Drizzle Studio (database GUI)
npm run db:makemigrations # Generate new migrations
npm run db:migrate       # Apply pending migrations
npm run db:seed          # Seed database with sample data

# Testing
npm run test             # Run tests with coverage
npm run test:db          # Open test database studio

# Code Quality
npm run lint             # Check code style and errors
npm run lint:fix         # Fix auto-fixable lint issues
```

## 🧪 Testing

The project includes comprehensive testing with Vitest:

```bash
# Run all tests with coverage
npm run test

# Run tests in watch mode (development)
npx vitest

# View coverage report
open coverage/index.html
```

### Test Structure
- **Unit Tests**: Individual function and component testing
- **Integration Tests**: API endpoint testing with real database
- **Test Database**: Separate PostgreSQL instance for testing
- **Factories**: Helper functions for creating test data
- **Coverage**: Detailed coverage reporting with exclusions for config files

## 📁 Project Structure

```
academic-manager/
├── src/
│   ├── app.ts              # Fastify application setup
│   ├── server.ts           # Server entry point
│   ├── database/
│   │   ├── client.ts       # Database connection
│   │   ├── schema.ts       # Drizzle schema definitions
│   │   └── seed.ts         # Database seeding
│   ├── middlewares/
│   │   ├── authenticate.ts # JWT authentication middleware
│   │   └── errorHandler.ts # Global error handling
│   └── routes/
│       ├── auth/
│       │   ├── routes.ts   # Authentication endpoints
│       │   ├── utils/      # Email confirmation utilities
│       │   └── tests/      # Authentication tests
│       └── courses/
│           ├── routes.ts   # Course management endpoints
│           ├── schemas.ts  # Validation schemas
│           └── tests/      # Course tests and factories
├── drizzle/                # Generated migrations
├── env/                    # Environment configuration
├── coverage/               # Test coverage reports
├── docker-compose.yml      # Database services
├── drizzle.config.ts       # Drizzle ORM configuration
├── vitest.config.ts        # Testing configuration
└── biome.json             # Code formatting and linting
```

## 🔧 Development Workflow

1. **Feature Development**:
   - Create feature branch
   - Write tests first (TDD approach)
   - Implement functionality
   - Ensure all tests pass
   - Run linting and fix issues

2. **Database Changes**:
   ```bash
   # 1. Modify schema in src/database/schema.ts
   # 2. Generate migration
   npm run db:makemigrations
   # 3. Apply migration
   npm run db:migrate
   ```

3. **Code Quality**:
   ```bash
   # Check code style
   npm run lint
   
   # Auto-fix issues
   npm run lint:fix
   
   # Run tests
   npm run test
   ```

## 🔒 Security Considerations

- **JWT Tokens**: Secure token-based authentication
- **Email Verification**: Required email confirmation for account activation
- **Input Validation**: Strict schema validation with Zod
- **SQL Injection**: Protected by Drizzle ORM parameterized queries
- **Environment Variables**: Sensitive data stored in environment files

## 📝 License

This project is licensed under the ISC License. See the `LICENSE` file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📧 Support

For support and questions, please open an issue in the repository or contact the development team.

---

Built with ❤️ using modern TypeScript and Node.js technologies.