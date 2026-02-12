import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Cognspective heading', () => {
  render(<App />);
  const heading = screen.getByText(/Cognspective/i);
  expect(heading).toBeInTheDocument();
});
