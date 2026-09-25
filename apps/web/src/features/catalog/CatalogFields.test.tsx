import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { api } from '../../api/client';
import CatalogFields from './CatalogFields';
vi.mock('../../api/client', () => ({ api: { get: vi.fn() } }));

describe('catalog lookup fields', () => {
  it('selects existing IDs after asynchronous options arrive and retains other fields', async () => {
    vi.mocked(api.get).mockImplementation(async url => ({ data: url === '/catalog/brands'
      ? [{ id: 17, name: '<script>Brand</script>' }] : [{ id: 29, name: 'City' }] }));
    const change = vi.fn();
    render(<MemoryRouter><CatalogFields value={{ brandId: 17, cityId: 29, finishedStock: 8, available: false }} onChange={change} /></MemoryRouter>);
    await waitFor(() => expect(screen.getByLabelText('Brand')).toHaveValue('17'));
    expect(screen.getByLabelText('City (geographic metadata)')).toHaveValue('29');
    expect(screen.getByText('<script>Brand</script>')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Finished stock (whole units)'), { target: { value: '9' } });
    expect(change).toHaveBeenCalledWith({ brandId: 17, cityId: 29, finishedStock: 9, available: false });
  });

  it('shows malformed lookup responses as errors without replacing saved IDs', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: null });
    const change = vi.fn();
    render(<MemoryRouter><CatalogFields value={{ brandId: 17 }} onChange={change} /></MemoryRouter>);
    expect(await screen.findByRole('alert')).toHaveTextContent('could not be loaded');
    expect(change).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Brand')).toBeDisabled();
  });
});
