# Frontend Agent Instructions

## Project Context

- **Project name:** RP360 Frontend — Renovation Marketplace React App
- **Tech stack:** React 19, TypeScript, Vite, Tailwind CSS, React Router v6, Zustand, TanStack Query, Socket.io, Stripe Elements
- **Key directories:**
  - `src/components/` — Atomic design: `atoms/`, `molecules/`, `organisms/`, `layouts/`
  - `src/pages/` — Route-level pages (public landing, homeowner dashboard, contractor profile, admin, etc.)
  - `src/stores/` — Zustand stores (auth, real queries)
  - `src/api/` — Axios API service modules (auth, projects, bids, contracts, payments, etc.)
  - `src/hooks/` — Custom React hooks for common patterns
  - `src/contexts/` — React context providers (Socket.io, Stripe)
  - `src/types/` — TypeScript type definitions and interfaces
  - `src/styles/` — Tailwind config, design tokens, custom CSS

## Component Architecture

Follow **atomic design pattern** — organize components by reusability and complexity:

### Atoms (`src/components/atoms/`)
Primitive, single-responsibility UI elements:
- `Button.tsx` — CTA with variants (primary, secondary, ghost, destructive)
- `Input.tsx` — Text input with validation feedback
- `Textarea.tsx` — Multi-line input
- `Badge.tsx` — Status/tag badge
- `Spinner.tsx` — Loading indicator
- `Skeleton.tsx` — Content placeholder
- `Avatar.tsx` — User/contractor avatar with initials fallback

**Pattern:**
```tsx
// atoms follow props-only pattern, no hooks except useState for local UI state
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export function Button({ variant = 'primary', size = 'md', isLoading, ...props }: ButtonProps) {
  // Component logic
}
```

### Molecules (`src/components/molecules/`)
Simple composites combining atoms for a single UI pattern:
- `Card.tsx` — Container with border, shadow, padding
- `FormField.tsx` — Label + Input + Error message
- `ProgressBar.tsx` — Visual progress indicator
- `StarRating.tsx` — 5-star rating interactive component
- `FileDropzone.tsx` — Drag-and-drop file upload zone
- `Accordion.tsx` — Expandable sections
- `RangeInput.tsx` — Slider for numeric ranges
- `Carousel.tsx` — Image/content carousel with navigation

**Pattern:**
```tsx
// molecules may use hooks, handle simple state, but no API calls
export function FileDropzone({ onFilesSelected, acceptedFormats }: FileDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  // Component logic
}
```

### Organisms (`src/components/organisms/`)
Complex sections combining molecules + business logic:
- `Header.tsx` — Top navigation, auth state, notifications bell, profile menu
- `SideBar.tsx` — Role-based navigation (homeowner/contractor), collapsible on mobile
- `MyMap.tsx` — Leaflet map wrapper with contractor service area polygons
- `BidComparison.tsx` — Side-by-side bid evaluation table

**Pattern:**
```tsx
// organisms may have API calls, state management, but keep page-level logic minimal
export function Header() {
  const { user } = useAuth();
  const { data: notifications } = useQuery(...);
  // Component logic
}
```

### Layouts (`src/components/layouts/`)
Page-level structural components:
- `DashboardLayout.tsx` — Sidebar + Header + Content area (responsive header on mobile)
- `AuthLayout.tsx` — Centered auth card layout
- `LandingLayout.tsx` — Hero + sections layout

### Pages (`src/pages/`)
Route-level containers that orchestrate:
- Fetch data via TanStack Query
- Handle complex state flows
- Compose layouts + organisms + molecules
- Route-specific business logic

**Pattern:**
```tsx
// pages are the orchestrators: data fetching, state management, routing
export function ProjectDetailsPage() {
  const { projectId } = useParams();
  const { data: project } = useQuery({
    queryKey: ['projects', projectId],
    queryFn: () => projectApi.getById(projectId),
  });
  
  return (
    <DashboardLayout>
      {/* Navigate to organisms, molecules, atoms */}
    </DashboardLayout>
  );
}
```

## State Management

### Auth Store (Zustand)
Located in `src/stores/auth.ts`:
```tsx
export const useAuth = create((set) => ({
  user: null,
  token: null,
  setUser: (user) => set({ user }),
  setToken: (token) => set({ token }),
  logout: () => set({ user: null, token: null }),
}));
```

Usage in components:
```tsx
const { user, logout } = useAuth();
```

### API Queries (TanStack Query)
Handle server state with automatic caching, refetching, and error handling:

```tsx
// In pages/components:
const { data, isLoading, error } = useQuery({
  queryKey: ['bids', projectId],
  queryFn: () => bidApi.getProjectBids(projectId),
});

// Mutations for side effects:
const { mutate: acceptBid } = useMutation({
  mutationFn: (bidId) => bidApi.acceptBid(bidId),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['bids'] });
    toast.success('Bid accepted');
  },
  onError: (err) => toast.error(err.message),
});
```

### Socket.io Context
Real-time updates for chat, notifications, project changes:

```tsx
// In contexts/SocketContext.tsx:
const socket = io(API_URL);

// In components:
const socket = useContext(SocketContext);
socket.on('new_message', (msg) => {
  // Update local state or invalidate queries
});
```

## API Integration

API calls organized by feature in `src/api/`:

```
src/api/
  ├── auth.ts       // Login, register, refresh token
  ├── projects.ts   // Project CRUD
  ├── bids.ts       // Bid operations
  ├── contracts.ts  // Contract signing, status
  ├── payments.ts   // Escrow, milestone release
  ├── messages.ts   // Chat, conversations
  └── contractors.ts // Search, profile
```

Each module exports typed functions:
```tsx
export const projectApi = {
  getById: async (id: string) => {
    const { data } = await axios.get(`/api/projects/${id}`);
    return data;
  },
  create: async (payload: CreateProjectInput) => {
    const { data } = await axios.post('/api/projects', payload);
    return data;
  },
};
```

## Development Commands

| Command         | Purpose                          |
| --------------- | -------------------------------- |
| `npm run dev`   | Start Vite dev server (:5173)    |
| `npm run build` | TypeScript check + prod build    |
| `npm run lint`  | ESLint check                     |
| `npm run test`  | Run Vitest                       |

## Key Features & Patterns

### Real-time Chat
- Socket.io listener in `contexts/SocketContext`
- Read receipts tracked in conversation state
- File attachments via S3 signed URLs
- Pagination for message history

### Stripe Payments
- Stripe Elements wrapper in `contexts/StripeContext`
- PaymentIntent flow for escrow funding
- Milestone release with homeowner approval modal
- Transaction history table

### Contractor Service Area Map
- Geoman drawing for contractor profile setup
- Read-only Leaflet polygon display for homeowner view
- Geospatial validation on backend

### Responsive Layout
- Sidebar collapses to hamburger menu on mobile
- Fixed header with notifications, profile dropdown
- Grid layouts adapt to screen size

## Common Pitfalls

1. **API calls in components** — Use TanStack Query, not useEffect + useState
2. **Auth token in localStorage** — Handled by axios interceptors; refresh flow automatic
3. **Uncontrolled form inputs** — Use react-hook-form with Zod validation schemas
4. **Missing error states** — Every query/mutation must have error handling and user feedback via toast
5. **Over-nesting components** — Extract atooms/molecules early to avoid prop drilling

## When to Create New Components

| Scenario                              | Location                    |
| ------------------------------------- | --------------------------- |
| Reused across many pages              | `atoms/` or `molecules/`    |
| Single-use but complex                | `molecules/` or `organisms/`|
| Combines multiple organisms           | Extract to new `organism/`  |
| Page-specific data orchestration      | Keep in `pages/`            |
| Shared page layout structure          | `layouts/`                  |

## Testing (Vitest + React Testing Library)

- Test atoms individually for prop variations
- Test molecules for common user interactions
- Test pages for data flow and routing
- Mock API calls with `vi.mock()`

---

**Last Updated:** April 2026
