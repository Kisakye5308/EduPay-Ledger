/**
 * Card Component Tests
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { Card, CardHeader, CardBody, CardFooter } from '@/components/ui/Card';

describe('Card Component', () => {
  it('renders card with children', () => {
    render(
      <Card>
        <p>Card Content</p>
      </Card>
    );
    expect(screen.getByText('Card Content')).toBeInTheDocument();
  });

  it('renders with padding when padded prop is true', () => {
    const { container } = render(
      <Card padded>
        <p>Padded Content</p>
      </Card>
    );
    expect(container.firstChild).toHaveClass('p-6');
  });

  it('renders CardHeader correctly', () => {
    render(
      <Card>
        <CardHeader title="Test Title" subtitle="Test Subtitle" />
      </Card>
    );
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Subtitle')).toBeInTheDocument();
  });

  it('renders CardHeader with action', () => {
    const action = <button>Action</button>;
    render(
      <Card>
        <CardHeader title="Title" action={action} />
      </Card>
    );
    expect(screen.getByRole('button', { name: /action/i })).toBeInTheDocument();
  });

  it('renders CardBody correctly', () => {
    render(
      <Card>
        <CardBody>
          <p>Body Content</p>
        </CardBody>
      </Card>
    );
    expect(screen.getByText('Body Content')).toBeInTheDocument();
  });

  it('renders CardFooter correctly', () => {
    render(
      <Card>
        <CardFooter>
          <button>Footer Action</button>
        </CardFooter>
      </Card>
    );
    expect(screen.getByRole('button', { name: /footer action/i })).toBeInTheDocument();
  });

  it('renders complete card with all sections', () => {
    render(
      <Card>
        <CardHeader title="Complete Card" />
        <CardBody>
          <p>Main content goes here</p>
        </CardBody>
        <CardFooter>
          <button>Submit</button>
        </CardFooter>
      </Card>
    );

    expect(screen.getByText('Complete Card')).toBeInTheDocument();
    expect(screen.getByText('Main content goes here')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <Card className="custom-class">
        <p>Content</p>
      </Card>
    );
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
