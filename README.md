# PFE Frontend UI Library

This project is a modern React + TypeScript frontend built with Vite, featuring a comprehensive set of reusable UI components styled with Tailwind CSS and custom design tokens.

## Features
- ⚡ Fast Vite-based development
- 🧩 Modular component architecture (Atoms, Molecules, Organisms)
- 🎨 Custom design tokens and Tailwind utility classes
- 📦 Ready-to-use components: Button, Input, Badge, Card, Spinner, Skeleton, Toast, EmptyState, ProgressBar, Avatar, Carousel, Checkbox, Textarea, Accordion, RangeInput, StarRating, DropdownMenu, FileDropzone, StateCard, and more
- 🛠️ ESLint and TypeScript for code quality

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Start the development server:**
   ```bash
   npm run dev
   ```
3. **Build for production:**
   ```bash
   npm run build
   ```

## Project Structure
```
src/
  components/
    atoms/        # Basic UI elements (Button, Input, etc.)
    molecules/    # Compound components (Card, Toast, etc.)
    organisms/    # Complex UI sections
  styles/         # Tailwind and custom CSS
  pages/          # App pages
  contexts/       # React context providers
  hooks/          # Custom React hooks
  lib/            # Utilities and helpers
```

## Customization
- Edit `src/styles/app.css` and `src/styles/components.css` for design tokens and custom styles.
- Extend or create new components in `src/components/` as needed.

## License
MIT
