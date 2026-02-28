# JLabs Exam Project - Next.js + PostgreSQL

This project uses Next.js as the full-stack framework and PostgreSQL for the database to power the login and IP geolocation features.

## Step-by-Step Setup Guide

Follow these steps to set up the project locally on your machine.

### 1. Install Dependencies
Run the following command to install all required libraries (including Prisma, bcrypt, etc.):
```bash
npm install
```

### 2. Set Up Environment Variables
Create a file named `.env` in the root of the project and add your PostgreSQL database connection URL. It should look something like this:
```env
DATABASE_URL="postgres://macbookpro@localhost:5432/jlabs_exam?sslmode=disable"
```
*(Replace `macbookpro` and `jlabs_exam` with your actual local Postgres user and database if different.)*

### 3. Initialize the Database Schema (Prisma)
Once your `.env` is set up, map the database tables by running:
```bash
npx prisma db push
```

### 4. Run the User Seeder
This project includes a seeder that automatically creates a test user. Run it using:
```bash
npx prisma db seed
```
This will create a user with:
- **Email**: `test@example.com`
- **Password**: `password123`
(You can use this account to test the login functionality!)

### 5. Start the Application
Finally, start up the Next.js development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the app.

### 6. Open Prisma Studio (Database GUI)
To view and manage your database tables visually, you can launch Prisma Studio natively using:
```bash
npm run studio
```
This script handles the environment variables properly to open Prisma's built-in GUI on your browser (usually at `http://localhost:5555`).
