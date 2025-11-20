# Accessibility Implementation Guide

## Pregled pristupačnosti

Ovaj projekat implementira kompletan sistem pristupačnosti u skladu sa WCAG 2.1 AAA standardima kako bi aplikacija bila pristupačna slabovidim i slepim osobama.

## Ključne komponente

### 1. AccessibilityProvider (`src/components/AccessibilityProvider.tsx`)
- **Svrha**: Obezbeđuje kontekst pristupačnosti kroz celu aplikaciju
- **Funkcionalnosti**: 
  - Toolbar za pristupačnost sa kontrolama veličine fonta i visokim kontrastom
  - Automatska detekcija korisničkih preferencija
  - Objave za čitače ekrana

### 2. Accessibility Utilities (`src/lib/accessibility.ts`)
- **Svrha**: Osnovne funkcionalnosti i hook-ovi za pristupačnost  
- **Funkcionalnosti**:
  - `useAccessibility` hook za navigaciju tastaturom
  - Upravljanje fokusom
  - Objave za čitače ekrana
  - Generiranje jedinstvenih ID-jeva

### 3. Accessible Components (`src/components/ui/AccessibleComponents.tsx`)
- **AccessibleModal**: Modali sa uhvaćenim fokusom i ARIA atributima
- **AccessibleAlert**: Obaveštenja sa live regions
- **AccessibleTabs**: Tabovi sa navigacijom strelicama

### 4. Form Components (`src/components/ui/AccessibleFormComponents.tsx`)
- **FormField**: Wrapper za polja forme sa proper labeliranjem
- **AccessibleSearchField**: Polje pretrage sa screen reader podrškom
- **AccessibleDataTable**: Tabele sa proper header asocijacijama

### 5. Feedback Components (`src/components/ui/AccessibleFeedback.tsx`)
- **AccessibleToast**: Toast notifikacije sa screen reader objavama
- **AccessibleLoadingSpinner**: Loading indikatori sa statusom
- **AccessibleProgressBar**: Progress bara sa ARIA atributima
- **AccessibleBreadcrumb**: Breadcrumb navigacija
- **SkipLink**: Skip linkovi za brzu navigaciju

## Globalni stilovi (`src/app/globals.css`)

### Skip Links
```css
.skip-link {
  position: absolute;
  top: -40px;
  left: 6px;
  background: #000;
  color: #fff;
  padding: 8px;
  text-decoration: none;
  z-index: 100;
}
```

### Screen Reader Utilities
```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

### Visoki kontrast
```css
@media (prefers-contrast: high) {
  :root {
    --bg-color: #000000;
    --text-color: #ffffff;
    --border-color: #ffffff;
  }
}
```

### Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Cursor Standards

### Interactive Elements
- **Buttons, Links**: `cursor: pointer`
- **Text inputs**: `cursor: text`
- **Disabled elements**: `cursor: not-allowed`
- **Help elements**: `cursor: help`
- **Draggable**: `cursor: grab` / `cursor: grabbing`

## Keyboard Navigation

### Standardni shortcuts
- **Ctrl + /**: Skip to main content
- **Escape**: Zatvaranje modala/dropdown-a
- **Tab/Shift+Tab**: Navigacija kroz elemente
- **Enter/Space**: Aktivacija button-a
- **Arrow keys**: Navigacija kroz tabove/liste

### Focus Management
- Vidljiv focus indicator na svim elementima
- Focus trapping u modalima
- Logical tab order
- Skip links za brzu navigaciju

## Screen Reader Support

### ARIA Attributes
```typescript
// Primeri proper ARIA korišćenja
<button 
  aria-label="Zatvori modal"
  aria-expanded={isOpen}
  aria-controls="modal-content"
>

<div 
  role="alert" 
  aria-live="assertive"
>
  Greška: Molimo popunite sva polja
</div>

<table role="table" aria-label="Lista rezervacija">
  <th scope="col">Datum</th>
  <td role="gridcell">15.01.2024</td>
</table>
```

### Live Regions
- `aria-live="polite"` za nenalazne updates
- `aria-live="assertive"` za hitne poruke
- `role="alert"` za greške
- `role="status"` za status updates

## Implementacija u postojeće komponente

### 1. Dodavanje u Layout
```typescript
// src/app/layout.tsx
import { AccessibilityProvider } from '@/components/AccessibilityProvider'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="sr">
      <body>
        <AccessibilityProvider>
          <SkipLink href="#main-content">
            Preskoči na glavni sadržaj
          </SkipLink>
          
          <main id="main-content" role="main">
            {children}
          </main>
        </AccessibilityProvider>
      </body>
    </html>
  )
}
```

### 2. Korišćenje u komponentama
```typescript
import { useAccessibility } from '@/lib/accessibility'
import { AccessibleModal, FormField } from '@/components/ui'

function MyComponent() {
  const { announceToScreenReader } = useAccessibility()

  const handleSubmit = () => {
    announceToScreenReader('Forma je uspešno poslata')
  }

  return (
    <AccessibleModal isOpen={isOpen} onClose={onClose} title="Rezervacija">
      <FormField 
        label="Ime" 
        required 
        error={errors.name}
        description="Unesite vaše puno ime"
      >
        <input type="text" />
      </FormField>
    </AccessibleModal>
  )
}
```

## Testiranje pristupačnosti

### Automatska testiranja
```bash
# Instaliranje accessibility testing tools
npm install --save-dev @axe-core/react
npm install --save-dev jest-axe
```

### Manuelno testiranje
1. **Keyboard navigation**: Testiraj navigaciju samo tastaturom
2. **Screen reader**: Testiraj sa NVDA, JAWS, ili VoiceOver
3. **High contrast**: Testiraj u high contrast mode
4. **Zoom**: Testiraj na 200% zoom
5. **Color blindness**: Testiraj sa color blindness simulatorima

### Testni checklist
- [ ] Svi interaktivni elementi su dostupni tastaturom
- [ ] Focus je uvek vidljiv
- [ ] Screen reader čita sve wichtige informacije
- [ ] Forme su proper labelovane
- [ ] Greške su jasno announced
- [ ] Navigacija je logična i konzistentna
- [ ] Kontrast odgovara WCAG standardima
- [ ] Aplikacija radi bez boja kao jedine informacije

## Održavanje

### Regularne provere
- Testiraj sve nove features sa screen reader-om
- Proveravaj keyboard navigation na svakoj stranici
- Koristi axe-core za automatsku validaciju
- Updatuj accessibility dokumentaciju

### Best Practices
- Uvek koristi semantic HTML
- Dodaji ARIA attribute gde je potrebno
- Testiraj sa stvarnim korisnicima
- Drži focus management konzistentan
- Updatuj screen reader announcements

Ovaj sistem obezbeđuje kompletnu pristupačnost za slabovidе i slepe osobe u skladu sa WCAG 2.1 AAA standardima.