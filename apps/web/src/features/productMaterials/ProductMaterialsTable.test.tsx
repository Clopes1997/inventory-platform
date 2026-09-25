import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ProductMaterialsTable from './ProductMaterialsTable';
import type { ProductMaterialDto } from '../../types/api';

describe('ProductMaterialsTable', () => {
  const defaultProps = {
    items: [] as ProductMaterialDto[],
    editingId: null as number | null,
    editQuantity: '',
    onEditQuantityChange: vi.fn(),
    onStartEdit: vi.fn(),
    onSaveEdit: vi.fn(),
    onCancelEdit: vi.fn(),
    onRemove: vi.fn(),
  };

  it('renders table headers', () => {
    render(<ProductMaterialsTable {...defaultProps} />);
    expect(screen.getByText('Raw material')).toBeInTheDocument();
    expect(screen.getByText('Required quantity')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
  });

  it('shows empty message when no items', () => {
    render(<ProductMaterialsTable {...defaultProps} />);
    expect(screen.getByText(/no materials\. add one below\./i)).toBeInTheDocument();
  });

  it('renders rows when items provided', () => {
    const items: ProductMaterialDto[] = [
      { id: 1, rawMaterialId: 1, rawMaterialCode: 'RM1', rawMaterialName: 'Steel', requiredQuantity: 5 },
      { id: 2, rawMaterialId: 2, rawMaterialCode: 'RM2', rawMaterialName: 'Copper', requiredQuantity: 10 },
    ];
    render(<ProductMaterialsTable {...defaultProps} items={items} />);
    expect(screen.getByText(/RM1.*Steel/)).toBeInTheDocument();
    expect(screen.getByText(/RM2.*Copper/)).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('calls onStartEdit when Edit clicked', () => {
    const onStartEdit = vi.fn();
    const items: ProductMaterialDto[] = [
      { id: 10, rawMaterialId: 1, rawMaterialCode: 'RM1', rawMaterialName: 'Steel', requiredQuantity: 5 },
    ];
    render(
      <ProductMaterialsTable
        {...defaultProps}
        items={items}
        onStartEdit={onStartEdit}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /edit/i }));
    expect(onStartEdit).toHaveBeenCalledWith(items[0]);
  });

  it('shows quantity input and Save/Cancel when editing', () => {
    const items: ProductMaterialDto[] = [
      { id: 10, rawMaterialId: 1, rawMaterialCode: 'RM1', rawMaterialName: 'Steel', requiredQuantity: 5 },
    ];
    render(
      <ProductMaterialsTable
        {...defaultProps}
        items={items}
        editingId={10}
        editQuantity="7"
      />
    );
    const input = screen.getByRole('spinbutton', { name: /edit required quantity/i });
    expect(input).toHaveValue(7);
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('calls onSaveEdit when Save clicked', () => {
    const onSaveEdit = vi.fn();
    const items: ProductMaterialDto[] = [
      { id: 10, rawMaterialId: 1, rawMaterialCode: 'RM1', rawMaterialName: 'Steel', requiredQuantity: 5 },
    ];
    render(
      <ProductMaterialsTable
        {...defaultProps}
        items={items}
        editingId={10}
        editQuantity="8"
        onSaveEdit={onSaveEdit}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /save/i }));
    expect(onSaveEdit).toHaveBeenCalled();
  });

  it('calls onCancelEdit when Cancel clicked', () => {
    const onCancelEdit = vi.fn();
    const items: ProductMaterialDto[] = [
      { id: 10, rawMaterialId: 1, rawMaterialCode: 'RM1', rawMaterialName: 'Steel', requiredQuantity: 5 },
    ];
    render(
      <ProductMaterialsTable
        {...defaultProps}
        items={items}
        editingId={10}
        onCancelEdit={onCancelEdit}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onCancelEdit).toHaveBeenCalled();
  });

  it('calls onRemove with id and code when Remove clicked', () => {
    const onRemove = vi.fn();
    const items: ProductMaterialDto[] = [
      { id: 10, rawMaterialId: 1, rawMaterialCode: 'RM1', rawMaterialName: 'Steel', requiredQuantity: 5 },
    ];
    render(
      <ProductMaterialsTable
        {...defaultProps}
        items={items}
        onRemove={onRemove}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /remove/i }));
    expect(onRemove).toHaveBeenCalledWith(10, 'RM1');
  });
});
