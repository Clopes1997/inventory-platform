import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AddProductMaterialForm from './AddProductMaterialForm';
import type { RawMaterialDto } from '../../types/api';

describe('AddProductMaterialForm', () => {
  const defaultProps = {
    availableRawMaterials: [] as RawMaterialDto[],
    rawMaterialId: '',
    quantity: '',
    onRawMaterialIdChange: vi.fn(),
    onQuantityChange: vi.fn(),
    onSubmit: vi.fn((e?: React.FormEvent) => e?.preventDefault?.()),
    isDisabled: true,
  };

  it('renders label, select, quantity input and Add button', () => {
    render(<AddProductMaterialForm {...defaultProps} />);
    expect(screen.getByLabelText(/add raw material/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/required quantity/i)).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument();
  });

  it('shows Select… as first option when no selection', () => {
    render(<AddProductMaterialForm {...defaultProps} />);
    expect(screen.getByRole('combobox')).toHaveValue('');
    expect(screen.getByRole('option', { name: 'Select…' })).toBeInTheDocument();
  });

  it('renders available raw materials in select', () => {
    const materials: RawMaterialDto[] = [
      { id: 1, code: 'RM1', name: 'Steel', stockQuantity: 0 },
      { id: 2, code: 'RM2', name: 'Copper', stockQuantity: 0 },
    ];
    render(<AddProductMaterialForm {...defaultProps} availableRawMaterials={materials} />);
    expect(screen.getByRole('option', { name: 'RM1 – Steel' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'RM2 – Copper' })).toBeInTheDocument();
  });

  it('calls onRawMaterialIdChange when select changes', () => {
    const onRawMaterialIdChange = vi.fn();
    const materials: RawMaterialDto[] = [{ id: 1, code: 'RM1', name: 'Steel', stockQuantity: 0 }];
    render(
      <AddProductMaterialForm
        {...defaultProps}
        availableRawMaterials={materials}
        onRawMaterialIdChange={onRawMaterialIdChange}
      />
    );
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '1' } });
    expect(onRawMaterialIdChange).toHaveBeenCalledWith('1');
  });

  it('calls onQuantityChange when quantity input changes', () => {
    const onQuantityChange = vi.fn();
    render(<AddProductMaterialForm {...defaultProps} onQuantityChange={onQuantityChange} />);
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '10' } });
    expect(onQuantityChange).toHaveBeenCalledWith('10');
  });

  it('calls onSubmit when form is submitted', () => {
    const onSubmit = vi.fn((e?: React.FormEvent) => e?.preventDefault?.());
    render(
      <AddProductMaterialForm
        {...defaultProps}
        onSubmit={onSubmit}
        isDisabled={false}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /add/i }));
    expect(onSubmit).toHaveBeenCalled();
  });

  it('disables Add button when isDisabled is true', () => {
    render(<AddProductMaterialForm {...defaultProps} isDisabled={true} />);
    expect(screen.getByRole('button', { name: /add/i })).toBeDisabled();
  });

  it('enables Add button when isDisabled is false', () => {
    render(<AddProductMaterialForm {...defaultProps} isDisabled={false} />);
    expect(screen.getByRole('button', { name: /add/i })).not.toBeDisabled();
  });
});
