Stream Master Pro (Next.js 16 Edition)

Stream Master Pro is a high-performance web-based application designed for analyzing, streaming, and downloading HLS video content. This version is a full-stack refactor of the original Alpine.js application, moving sensitive logic to the server and adding user persistence.

Key Features

Server-Side API Handshakes: Securely handles Watchit and Brightcove API requests.

Role-Based Access Control: Dedicated Admin and User tiers.

Global Series Library: Automatically stores metadata for analyzed series.

User Activity FIFO: Persists the last 5 series and 10 episodes viewed per user.

Advanced HLS Player: Optimized buffer management and custom seeking logic.

In-Browser MP4 Conversion: Uses FFmpeg.wasm for high-quality downloads.

Tech Stack

Framework: Next.js 16 (App Router, Turbopack, React 19.2)

Database: Prisma (PostgreSQL/SQLite)

Auth: NextAuth.js

Media: Hls.js & FFmpeg.wasm

UI: Tailwind CSS & Lucide Icons

Getting Started

Install dependencies: npm install

Sync Database: npx prisma db push

Run dev server: npm run dev