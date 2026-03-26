# RP360 Frontend

React + TypeScript frontend for the RP360 renovation platform, built with Vite and Tailwind CSS.

## Tech Stack

- **Framework:** React 18 with TypeScript
- **Build:** Vite
- **Styling:** Tailwind CSS with custom design tokens (indigo primary, teal secondary)
- **State:** Zustand (auth store)
- **Routing:** React Router v6
- **Maps:** React-Leaflet + Leaflet (service area polygons, geoman drawing)
- **Payments:** Stripe Elements (`@stripe/react-stripe-js`)
- **Real-time:** Socket.io client
- **HTTP:** Axios with interceptors (JWT refresh)
- **Notifications:** Sonner (toast)

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Environment**

   ```bash
   cp .env.example .env
   ```

   Required variables:
   ```
   VITE_API_URL=http://localhost:3000
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
   VITE_GOOGLE_CLIENT_ID=...
   ```

3. **Run**

   ```bash
   # Development
   npm run dev

   # Production build
   npm run build
   npm run preview
   ```

   Dev server runs on `http://localhost:5173`.

## Scripts

| Script            | Description                     |
| ----------------- | ------------------------------- |
| `npm run dev`     | Start Vite dev server           |
| `npm run build`   | TypeScript check + production build |
| `npm run preview` | Preview production build        |
| `npm run lint`    | Run ESLint                      |

## Project Structure

```
src/
  api/              # API service modules (axios calls)
  components/
    atoms/          # Button, Input, Badge, Spinner, Skeleton, etc.
    molecules/      # Card, Toast, EmptyState, ProgressBar, etc.
    organisms/      # Header, SideBar
    layouts/        # DashboardLayout (responsive sidebar + header)
    ui/             # Map components (GeomanControl, MyMap)
  contexts/         # React context providers (Socket, Stripe)
  hooks/            # Custom hooks
  lib/              # Utilities and helpers
  pages/            # Route pages
  stores/           # Zustand stores (auth)
  styles/           # Tailwind config, design tokens, custom CSS
  types/            # TypeScript type definitions
```

## Pages

| Area             | Pages                                                        |
| ---------------- | ------------------------------------------------------------ |
| **Public**       | Landing page, How It Works, Login, Register (email + Google) |
| **Homeowner**    | Dashboard, Project Details, Find Contractors, Contractor Details, Payments, Profile, Messages |
| **Contractor**   | Dashboard, Project Details, Profile (specialties, portfolio, service area map), Messages |
| **Admin**        | Dashboard (users, contractor vetting, disputes)              |
| **Shared**       | Messages (real-time chat, file sharing, pagination), Notifications |

## Key Features

- **Responsive layout** with collapsible sidebar on mobile and fixed header with notifications/profile
- **Google OAuth** sign-in alongside email/password authentication
- **Real-time messaging** with Socket.io, date separators, edit/delete, file attachments, shared files sidebar
- **Interactive maps** for contractor service area drawing (Geoman) and read-only display (Leaflet polygon)
- **Milestone tracking** with proof photo upload, lightbox viewer, and dispute dialog with message
- **Stripe payments** with escrow funding modal, milestone release, and transaction history
- **Bid comparison** modal for side-by-side evaluation
- **Review system** with category star ratings (quality, communication, timeliness, budget)
- **Portfolio management** for contractors with image gallery and lightbox navigation
- **Contractor search** with star ratings and clickable cards

## Component Library

Atomic design pattern with reusable components:

- **Atoms:** Button, Input, Textarea, Badge, Checkbox, Spinner, Skeleton, Avatar
- **Molecules:** Card, Toast, EmptyState, ProgressBar, StarRating, FileDropzone, Accordion, RangeInput, DropdownMenu, Carousel
- **Organisms:** Header, SideBar
- **UI:** AlertDialog, GeomanControl, MyMap

## License

MIT
