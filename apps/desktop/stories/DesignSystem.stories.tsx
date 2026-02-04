import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

// Placeholder story for Design System verification
// T-C5.4: Storybook Configuration

const meta: Meta = {
  title: 'Design System/Tokens',
  parameters: {
    layout: 'centered',
  },
};

export default meta;

export const Colors: StoryObj = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
      <div style={{ width: 100, height: 100, background: '#0f1419' }}>Primary</div>
      <div style={{ width: 100, height: 100, background: '#00d4aa' }}>Accent</div>
      <div style={{ width: 100, height: 100, background: '#4caf50' }}>Success</div>
      <div style={{ width: 100, height: 100, background: '#f44336' }}>Danger</div>
    </div>
  ),
};

export const Spacing: StoryObj = {
  render: () => (
    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
      <div style={{ width: 8, height: 8, background: '#00d4aa' }}></div>
      <div style={{ width: 16, height: 16, background: '#00d4aa' }}></div>
      <div style={{ width: 24, height: 24, background: '#00d4aa' }}></div>
      <div style={{ width: 32, height: 32, background: '#00d4aa' }}></div>
    </div>
  ),
};

export const Typography: StoryObj = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <h1 style={{ fontSize: '2.25rem', fontWeight: 700 }}>Heading 1</h1>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Heading 2</h2>
      <p style={{ fontSize: '1rem', fontWeight: 400 }}>Body text</p>
      <small style={{ fontSize: '0.75rem', fontWeight: 400 }}>Caption</small>
    </div>
  ),
};
