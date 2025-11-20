# Testing Guide - Zakazivač

## Brzi početak za nove developere

### 1. Setup (jednokratno)
```bash
# Clone repo ako već nisi
git clone <repo-url>
cd zakazivac

# Install dependencies
npm install

# Setup environment (.env.local sa MongoDB URI)
cp .env.example .env.local
# Edituj .env.local sa MongoDB connection string
```

### 2. Provjeri da li testovi rade
```bash
# Test osnovnu infrastrukturu
npm run test:models

# Očekivani rezultat: 78+ testova prolazi, coverage >70%
```

### 3. Development workflow
```bash
# Terminal 1: Development server
npm run dev

# Terminal 2: Test watcher
npm run test:watch

# Kod se edituje, testovi se automatski pokreću
```

## Test Commands Reference

| Command | Opis | Kada koristiti |
|---------|------|----------------|
| `npm test` | Pokreni sve testove jednom | Pre commit, CI/CD |
| `npm run test:watch` | Watch mode sa auto-reload | Development |
| `npm run test:coverage` | Coverage report | Pre commit |
| `npm run test:models` | Samo model testovi | Brza provjera |
| `npm run test:api` | Samo API testovi | API development |
| `npm run test:verbose` | Detaljni output | Debug |

## Test kategorije

### ✅ Model testovi (Unit Tests)
- **Status**: 78/95 prolazi (82%)
- **Location**: `tests/models/`
- **Što testiraju**: Mongoose modeli, validacija, relationships

```bash
# Pokreni samo model testove
npm run test:models

# Specifican model
npx jest tests/models/User.test.ts
```

### 🔄 API testovi (Integration Tests) 
- **Status**: U razvoju
- **Location**: `tests/api/`
- **Što testiraju**: HTTP endpoints, authentication, permissions

```bash
# Pokreni API testove
npm run test:api

# Specifican endpoint
npx jest tests/api/auth/register.test.ts
```

### 🚧 Service testovi (Unit Tests)
- **Status**: Planirano
- **Location**: `tests/services/`
- **Što testiraju**: Business logic, external APIs

## Dodavanje novog testa

### 1. Model test
```typescript
// tests/models/NewModel.test.ts
import { describe, it, expect, beforeEach } from '@jest/globals'
import NewModel from '@/models/NewModel'
import DatabaseTestUtils from '../utils/databaseUtils'

describe('NewModel', () => {
  beforeEach(async () => {
    await DatabaseTestUtils.cleanDatabase()
  })

  it('should create valid model with required fields', async () => {
    const data = {
      name: 'Test Name',
      // ... ostala required polja
    }

    const model = new NewModel(data)
    const savedModel = await model.save()

    expect(savedModel._id).toBeDefined()
    expect(savedModel.name).toBe('Test Name')
  })

  it('should throw validation error if required field is missing', async () => {
    const data = {
      // propusti required polje
    }

    const model = new NewModel(data)
    
    await expect(model.save()).rejects.toThrow('required')
  })
})
```

### 2. API test
```typescript
// tests/api/newEndpoint.test.ts
import { describe, it, expect } from '@jest/globals'
import request from 'supertest'
import { mockGetServerSession } from '../utils/testHelpers'

describe('/api/new-endpoint', () => {
  it('should return data for authenticated user', async () => {
    // Mock authentication
    mockGetServerSession({ 
      user: { id: '123', roles: ['client'] } 
    })
    
    const response = await request('http://localhost:3000')
      .get('/api/new-endpoint')
      .expect(200)
      
    expect(response.body).toBeDefined()
  })

  it('should return 401 for unauthenticated user', async () => {
    mockGetServerSession(null) // No session
    
    await request('http://localhost:3000')
      .get('/api/new-endpoint')
      .expect(401)
  })
})
```

## Mock Factories

Koristi postojeće mock factories umjesto kreiranja objekata od nule:

```typescript
import { 
  createMockUser,
  createMockProviderProfile,
  createMockCategory,
  createMockService,
  createMockBooking,
  createMockGoogleIntegration
} from '../utils/testHelpers'

// Dobro ✅
const user = createMockUser({ 
  email: 'custom@example.com' 
})

// Izbjegavaj ❌
const user = {
  email: 'custom@example.com',
  name: 'Custom User',
  // ... puno manual fieldova
}
```

## Database testiranje

Svi testovi koriste **MongoDB Memory Server**:

- ✅ Automatski setup/cleanup
- ✅ Izolovan od production DB
- ✅ Brž od Docker-a
- ✅ Nema external dependencies

```typescript
// Automatski se poziva u svakom testu
beforeEach(async () => {
  await DatabaseTestUtils.cleanDatabase()
})
```

## Coverage Requirements

- **Minimum**: 70% code coverage
- **Target**: 80%+ za production
- **Check**: `npm run test:coverage`

```bash
# Generiraj coverage report
npm run test:coverage

# Coverage report se otvara u browseru
# Ili pogledaj console output
```

## Debugging testova

### Verbose output
```bash
npm run test:verbose
npx jest --verbose tests/models/User.test.ts
```

### Debug mode
```bash
npm run test:debug
# Ili direktno:
node --inspect-brk node_modules/.bin/jest --runInBand
```

### Specific tests
```bash
# Test pattern matching
npx jest --testNamePattern="should create valid"
npx jest --testPathPattern="models"

# Single file
npx jest tests/models/User.test.ts

# Single test
npx jest --testNamePattern="should create valid user"
```

## CI/CD Integration

```yaml
# GitHub Actions example
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm install
      - run: npm run test:ci
      - run: npm run test:coverage
```

## Troubleshooting

### Windows specific issues
```bash
# Koristi cross-env commands
npm run test:ci  # umjesto direktnog jest
```

### MongoDB connection errors
```bash
# Memory server needs time to start
npx jest --testTimeout=10000
```

### Port conflicts
```bash
# Restart test suite
npm run test:ci
```

### Cache issues
```bash
# Clear Jest cache
npx jest --clearCache
npm run test:ci
```

## Najbolje prakse

1. **Jedan test = jedna funkcionalnost**
2. **Opisni nazivi testova** koji objašnjavaju što se testira
3. **Arrange-Act-Assert pattern**
4. **Testiraj edge cases** i error scenarije
5. **Mock external dependencies** (APIs, services)
6. **Clean state između testova**
7. **Fast feedback loop** sa watch mode

## Što testirati

### ✅ Uvijek testiraj:
- Model validation (required fields, formats)
- API endpoints (auth, permissions, responses)
- Business logic (calculations, rules)
- Error handling (validation errors, network failures)

### ❌ Izbjegavaj testirati:
- Third-party libraries (MongoDB, NextAuth)
- Next.js internal functionality
- UI styling details
- Integration sa external services (osim mocking)

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Library](https://testing-library.com/docs/)
- [Supertest API Testing](https://github.com/visionmedia/supertest)
- [MongoDB Memory Server](https://github.com/nodkz/mongodb-memory-server)