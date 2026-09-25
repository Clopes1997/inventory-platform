import type { ProductMaterialDto } from '../../types/api';

interface ProductMaterialsTableProps {
  items: ProductMaterialDto[];
  editingId: number | null;
  editQuantity: string;
  editQuantityError?: string | null;
  onEditQuantityChange: (value: string) => void;
  onStartEdit: (row: ProductMaterialDto) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onRemove: (id: number, code: string) => void;
}

export default function ProductMaterialsTable({
  items,
  editingId,
  editQuantity,
  editQuantityError,
  onEditQuantityChange,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onRemove,
}: ProductMaterialsTableProps) {
  const itemsList = Array.isArray(items) ? items : [];

  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Raw material</th>
            <th>Required quantity</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {itemsList.length === 0 ? (
            <tr>
              <td colSpan={3}>No materials. Add one below.</td>
            </tr>
          ) : (
            itemsList.map((row) => (
              <tr key={row.id}>
                <td>
                  {row.rawMaterialCode} – {row.rawMaterialName}
                </td>
                <td>
                  {editingId === row.id ? (
                    <input
                      type="number"
                      step="any"
                      min="0.0001"
                      value={editQuantity}
                      onChange={(e) => onEditQuantityChange(e.target.value)}
                      className="input-qty-edit"
                      aria-label="Edit required quantity"
                      aria-invalid={Boolean(editQuantityError)}
                      aria-describedby={editQuantityError ? 'edit-quantity-error' : undefined}
                    />
                  ) : (
                    Number(row.requiredQuantity)
                  )}
                </td>
                <td>
                  {editingId === row.id ? (
                    <>
                      <button type="button" className="btn btn-primary" onClick={onSaveEdit}>
                        Save
                      </button>
                      <button type="button" className="btn btn-secondary btn-gap-left" onClick={onCancelEdit}>
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button type="button" className="btn btn-secondary btn-gap-right" onClick={() => onStartEdit(row)}>
                        Edit
                      </button>
                      <button type="button" className="btn btn-danger" onClick={() => onRemove(row.id, row.rawMaterialCode)}>
                        Remove
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
