import type { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers';

// TODO: delete this file once @testing-library/jest-dom ships Vitest 5 support (testing-library/jest-dom#738, fix in #742).
declare module 'vitest' {
  interface Matchers<R, T> extends TestingLibraryMatchers<unknown, R> {}
}
