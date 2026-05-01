// Use vitest-specific augmentation so jest-dom matchers are typed on vitest's Assertion interface
// (not jest.Matchers), which also includes vitest-only matchers like toHaveBeenCalledOnce.
import '@testing-library/jest-dom/vitest'
