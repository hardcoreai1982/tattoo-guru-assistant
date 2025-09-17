# Testing Guide

This document provides comprehensive information about the testing setup and practices for the Tattoo Guru Assistant project.

## Testing Stack

### Unit & Integration Testing
- **Vitest**: Fast unit test runner with native TypeScript support
- **React Testing Library**: Component testing utilities
- **Jest DOM**: Custom matchers for DOM testing
- **MSW**: API mocking for integration tests
- **User Event**: Realistic user interaction simulation

### End-to-End Testing
- **Playwright**: Cross-browser E2E testing
- **Multiple browsers**: Chrome, Firefox, Safari, Mobile Chrome, Mobile Safari
- **Visual regression**: Screenshot comparison
- **Network mocking**: API response simulation

## Test Structure

```
src/
├── test/
│   ├── setup.ts              # Test environment setup
│   ├── utils.tsx              # Test utilities and helpers
│   └── integration/           # Integration tests
├── components/
│   └── __tests__/             # Component unit tests
├── services/
│   └── __tests__/             # Service unit tests
└── hooks/
    └── __tests__/             # Hook unit tests

e2e/                           # End-to-end tests
├── tattoo-creation.spec.ts    # Main user flows
├── style-transfer.spec.ts     # Style transfer workflows
└── mobile.spec.ts             # Mobile-specific tests
```

## Running Tests

### Unit Tests
```bash
# Run all unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm run test -- src/services/__tests__/styleTransferService.test.ts
```

### End-to-End Tests
```bash
# Run all E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run E2E tests in headed mode (visible browser)
npm run test:e2e:headed

# Run specific E2E test
npx playwright test e2e/tattoo-creation.spec.ts
```

### All Tests
```bash
# Run all tests (unit + E2E)
npm run test:all
```

## Test Categories

### 1. Unit Tests

#### Service Tests
- **StyleTransferService**: Style transformation logic, compatibility scoring, error handling
- **PromptEnhancementPipeline**: Multi-stage prompt enhancement, confidence calculation
- **DesignService**: Tattoo generation, design saving, API integration
- **ConversationService**: Chat functionality, message handling

#### Component Tests
- **TattooCreator**: Form interactions, generation workflow, state management
- **StyleTransferPanel**: Style selection, transfer options, result display
- **AdvancedPromptBuilder**: Prompt enhancement UI, template system
- **DesignGallery**: Design display, filtering, pagination

#### Hook Tests
- **useMobileOptimizations**: Mobile detection, touch handling
- **useErrorHandling**: Error state management, recovery
- **useLoadingStates**: Loading state coordination

### 2. Integration Tests

#### Workflow Tests
- **Tattoo Creation Flow**: Complete creation workflow from prompt to saved design
- **Style Transfer Flow**: End-to-end style transformation process
- **Prompt Enhancement Flow**: Advanced prompt building and enhancement
- **Error Recovery Flow**: Error handling and user recovery paths

#### API Integration Tests
- **Supabase Integration**: Database operations, authentication
- **AI Model Integration**: Generation API calls, response handling
- **File Upload Integration**: Image handling, storage operations

### 3. End-to-End Tests

#### User Journeys
- **New User Onboarding**: First-time user experience
- **Design Creation**: Complete tattoo creation process
- **Style Exploration**: Style transfer and comparison
- **Gallery Management**: Saving, organizing, sharing designs

#### Cross-Browser Testing
- **Desktop Browsers**: Chrome, Firefox, Safari
- **Mobile Browsers**: Mobile Chrome, Mobile Safari
- **Responsive Design**: Different viewport sizes
- **Touch Interactions**: Mobile-specific gestures

## Test Utilities

### Custom Render Function
```typescript
import { render } from '@/test/utils'

// Renders component with all necessary providers
render(<TattooCreator />)
```

### Mock Data Generators
```typescript
import { mockUser, mockTattooDesign, mockStyleTransferResult } from '@/test/utils'

// Use pre-configured mock data
const user = mockUser
const design = mockTattooDesign
```

### API Mocking
```typescript
// Mock Supabase responses
const mockQuery = mockSupabaseQuery()
mockQuery.single.mockResolvedValue(mockSupabaseResponse(mockTattooDesign))

// Mock API responses
const response = mockApiResponses.generateTattoo.success
```

### Accessibility Testing
```typescript
import { checkAccessibility } from '@/test/utils'

const issues = await checkAccessibility(container)
expect(issues).toHaveLength(0)
```

## Testing Best Practices

### 1. Test Structure
- **Arrange**: Set up test data and mocks
- **Act**: Perform the action being tested
- **Assert**: Verify the expected outcome

### 2. Test Naming
- Use descriptive test names that explain the scenario
- Follow pattern: "should [expected behavior] when [condition]"
- Group related tests using `describe` blocks

### 3. Mock Strategy
- Mock external dependencies (APIs, services)
- Use real implementations for internal logic
- Reset mocks between tests

### 4. Async Testing
- Use `waitFor` for async operations
- Avoid arbitrary timeouts
- Test loading and error states

### 5. User-Centric Testing
- Test from user's perspective
- Use semantic queries (getByRole, getByLabelText)
- Simulate realistic user interactions

## Coverage Requirements

### Minimum Coverage Thresholds
- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

### Coverage Exclusions
- Test files
- Configuration files
- Type definitions
- Storybook stories
- Build artifacts

## Continuous Integration

### GitHub Actions Workflow
```yaml
- name: Run Unit Tests
  run: npm run test:coverage

- name: Run E2E Tests
  run: npm run test:e2e

- name: Upload Coverage
  uses: codecov/codecov-action@v3
```

### Quality Gates
- All tests must pass
- Coverage thresholds must be met
- No accessibility violations
- Performance budgets respected

## Debugging Tests

### Unit Test Debugging
```bash
# Debug specific test
npm run test -- --reporter=verbose src/components/__tests__/TattooCreator.test.tsx

# Debug with browser
npm run test:ui
```

### E2E Test Debugging
```bash
# Run with visible browser
npm run test:e2e:headed

# Debug mode with step-by-step execution
npx playwright test --debug

# Generate test report
npx playwright show-report
```

### Common Issues

#### Test Timeouts
- Increase timeout for slow operations
- Use proper async/await patterns
- Mock slow external dependencies

#### Flaky Tests
- Avoid race conditions with proper waits
- Use deterministic test data
- Mock time-dependent operations

#### Memory Leaks
- Clean up event listeners
- Reset global state between tests
- Properly unmount components

## Performance Testing

### Load Testing
- Test with large datasets
- Measure render performance
- Monitor memory usage

### Accessibility Testing
- Screen reader compatibility
- Keyboard navigation
- Color contrast validation

### Mobile Testing
- Touch interactions
- Responsive layouts
- Performance on slower devices

## Test Data Management

### Mock Data
- Use realistic test data
- Maintain data consistency
- Version control test fixtures

### Test Databases
- Use separate test database
- Clean up after tests
- Seed with known data

### Environment Variables
- Use test-specific configuration
- Mock external services
- Isolate test environments

## Reporting

### Coverage Reports
- HTML reports for detailed analysis
- JSON reports for CI integration
- Trend analysis over time

### Test Results
- JUnit XML for CI systems
- HTML reports for human review
- Screenshots for E2E failures

### Performance Metrics
- Bundle size analysis
- Runtime performance
- Memory usage patterns

## Contributing

### Adding New Tests
1. Follow existing patterns
2. Include both happy path and error cases
3. Test accessibility requirements
4. Update documentation

### Test Review Checklist
- [ ] Tests are comprehensive
- [ ] Edge cases are covered
- [ ] Mocks are appropriate
- [ ] Performance is acceptable
- [ ] Accessibility is tested
