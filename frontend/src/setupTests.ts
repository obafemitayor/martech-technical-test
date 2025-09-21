import 'core-js/actual/structured-clone';

// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

if (typeof window.PointerEvent === 'undefined') {
  class PointerEvent extends MouseEvent {}
  window.PointerEvent = PointerEvent as any;
}
