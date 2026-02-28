# GeoIntel - Advanced Geolocation Intelligence System

GeoIntel is a professional, high-performance web application designed for real-time IPv4 geolocation tracking and network intelligence. Built with a premium "Glassmorphism" UI, it provides detailed insights into network nodes, ISP tiers, and geographical data.

## 🔗 Live Deployment

- **Hosted Version**: [https://jlabs-output.vercel.app/jlabs/login](https://jlabs-output.vercel.app/jlabs/login)
- **Repository**: [https://github.com/brybryson/jlabs-output.git](https://github.com/brybryson/jlabs-output.git)

## 🚀 Core Features

-   **Real-time Geolocation**: Instantly map any IPv4 address with detailed city, region, and country data.
-   **Interactive Satellite View**: High-performance interactive maps with smooth "Fly-To" transitions.
-   **Network Intelligence**: Deep-dive into ISP information, ASN details, and network stability metrics.
-   **Persistence & History**: Securely store and manage your search history with a PostgreSQL backend.
-   **Premium UI/UX**: Optimized for all devices with a fluid "Slide-Over" sidebar and motion-optimized interfaces.
-   **Chrome Optimized**: Performance-tuned to ensure stability and speed on Google Chrome and Safari.

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | [Next.js 15+](https://nextjs.org/) (App Router) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) |
| **Database** | [Supabase](https://supabase.com/) (PostgreSQL) |
| **ORM** | [Prisma](https://www.prisma.io/) |
| **Maps** | [React Leaflet](https://react-leaflet.js.org/) & [OpenStreetMap](https://www.openstreetmap.org/) |
| **Styling** | [Tailwind CSS 4.0](https://tailwindcss.com/) & Vanilla CSS |
| **Auth** | JWT-based session management (`jose`) |
| **Icons** | [Google Material Symbols](https://fonts.google.com/icons) |

## 📦 Setup & Installation

### 1. Prerequisite
Ensure you have **Node.js 18+** and a **PostgreSQL** instance running locally or in the cloud.

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory:
```env
# Database Connection (Example for local Postgres)
DATABASE_URL="postgres://macbookpro@localhost:5432/jlabs_exam?sslmode=disable"

# Secret for JWT
JWT_SECRET="your_secure_random_secret_here"
```

### 4. Database Initialization
Map the schema to your database:
```bash
npx prisma db push
```

### 5. Seeding Test Data
Initialize the database with the core test account:
```bash
npm run seed
```
**Default Credentials:**
- **Email**: `test@example.com`
- **Password**: `password123`

*(Note: On the hosted version, you can simply click the **"Seed Test Database"** button on the login page!)*

## 🚀 Running the App

### Development Mode
```bash
npm run dev
```
Open [http://localhost:3000/jlabs/login](http://localhost:3000/jlabs/login)

### Production Build
```bash
npm run build
npm run start
```

## 🛠️ Management Tools

### Database GUI (Prisma Studio)
Launch the visual database manager:
```bash
npm run studio
```
Access at `http://localhost:5555`

## 📂 Project Structure
- `/app` - Next.js App Router (Pages & API Routes)
- `/components` - Reusable UI components (Map, etc.)
- `/lib` - Core logic, database clients, and utilities
- `/prisma` - Database schema and seed scripts
- `/public` - Static assets and branding logos
