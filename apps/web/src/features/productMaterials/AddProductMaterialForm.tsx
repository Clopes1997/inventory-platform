import { FormEvent } from 'react';
import type { RawMaterialDto } from '../../types/api';
import FieldError from '../../components/FieldError';

interface AddProductMaterialFormProps {
  availableRawMaterials?: RawMaterialDto[];
  rawMaterialId: string;
  quantity: string;
  onRawMaterialIdChange: (value: string) => void;
  onQuantityChange: (value: string) => void;
  onSubmit: (e: FormEvent) => void;
  isDisabled: boolean;
  rawMaterialIdError?: string;
  quantityError?: string;
}

export default function AddProductMaterialForm({
  availableRawMaterials = [],
  rawMaterialId,
  quantity,
  onRawMaterialIdChange,
  onQuantityChange,
  onSubmit,
  isDisabled,
  rawMaterialIdError,
  quantityError,
}: AddProductMaterialFormProps) {
  const list = Array.isArray(availableRawMaterials) ? availableRawMaterials : [];

  return (
    <form onSubmit={onSubmit} className="form-inline">
      <div className="form-group form-group-inline">
        <label htmlFor="add-raw-material-select">Add raw material</label>
        <select
          id="add-raw-material-select"
          data-testid="add-raw-material-select"
          value={rawMaterialId}
          onChange={(e) => onRawMaterialIdChange(e.target.value)}
          className="select-min-width"
          aria-invalid={Boolean(rawMaterialIdError)}
          aria-describedby={rawMaterialIdError ? 'add-raw-material-select-error' : undefined}
        >
          <option value="">Select…</option>
          {list.map((r) => (
            <option key={r.id} value={r.id}>
              {r.code} – {r.name}
            </option>
          ))}
        </select>
        <FieldError id="add-raw-material-select-error" message={rawMaterialIdError} />
      </div>
      <div className="form-group form-group-inline">
        <label htmlFor="add-required-quantity">Required quantity</label>
        <input
          id="add-required-quantity"
          data-testid="add-required-quantity"
          type="number"
          step="any"
          min="0.0001"
          value={quantity}
          onChange={(e) => onQuantityChange(e.target.value)}
          className="input-qty-add"
          aria-invalid={Boolean(quantityError)}
          aria-describedby={quantityError ? 'add-required-quantity-error' : undefined}
        />
        <FieldError id="add-required-quantity-error" message={quantityError} />
      </div>
      <button type="submit" className="btn btn-primary" disabled={isDisabled}>
        Add
      </button>
    </form>
  );
}
