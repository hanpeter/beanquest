import type { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers';

// jest-dom 7 still augments Vitest's Assertion with one type parameter; Vitest 5 has two.
declare module 'vitest' {
  interface Assertion<R, T> extends TestingLibraryMatchers<T, R> {}
  interface AsymmetricMatchersContaining extends TestingLibraryMatchers<any, any> {}
}
