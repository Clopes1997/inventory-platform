import { useEffect, useState, FormEvent } from 'react';
import {
  fetchProductMaterials,
  addProductMaterial,
  updateProductMaterial,
  deleteProductMaterial,
  clearMaterials,
  clearError,
} from './productMaterialsSlice';
import { fetchRawMaterialsForSelection } from '../rawMaterials/rawMaterialsSlice';
import ProductMaterialsTable from './ProductMaterialsTable';
import AddProductMaterialForm from './AddProductMaterialForm';
import { useAppDispatch, useAppSelector } from '../../store';
import type { ProductMaterialDto, RawMaterialDto } from '../../types/api';
import toast from 'react-hot-toast';
import { addProductMaterialSchema, requiredQuantitySchema } from '../../validation/schemas';
import { getErrorMessage } from '../../utils/errorMessage';
import { showConfirm } from '../../utils/alerts';

interface ProductMaterialsSectionProps {
  productId: string;
}

export default function ProductMaterialsSection({ productId }: ProductMaterialsSectionProps) {
  const dispatch = useAppDispatch();
  const { items, loading, error } = useAppSelector((state) => state.productMaterials);
  const rawMaterials = useAppSelector((state) => state.rawMaterials.selectionList);

  const itemsList: ProductMaterialDto[] = Array.isArray(items) ? items : [];
  const rawMaterialsList: RawMaterialDto[] = Array.isArray(rawMaterials) ? rawMaterials : [];
  const usedRawMaterialIds = itemsList.map((m) => m.rawMaterialId);
  const availableRawMaterials = rawMaterialsList.filter((r) => !usedRawMaterialIds.includes(r.id));

  const [addRawMaterialId, setAddRawMaterialId] = useState('');
  const [addQuantity, setAddQuantity] = useState('');
  const [addFieldErrors, setAddFieldErrors] = useState<{ rawMaterialId?: string; requiredQuantity?: string }>({});
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editQuantity, setEditQuantity] = useState('');
  const [editQuantityError, setEditQuantityError] = useState<string | null>(null);

  useEffect(() => {
    if (!productId) return;
    dispatch(clearMaterials());
    dispatch(fetchProductMaterials(productId));
    dispatch(fetchRawMaterialsForSelection());
  }, [dispatch, productId]);

  useEffect(() => {
    return () => { dispatch(clearMaterials()); };
  }, [dispatch]);

  const handleAdd = (e: FormEvent) => {
    e.preventDefault();
    setAddFieldErrors({});
    const numQty = addQuantity === '' ? NaN : Number(addQuantity);
    const result = addProductMaterialSchema.safeParse({
      rawMaterialId: addRawMaterialId,
      requiredQuantity: Number.isNaN(numQty) ? undefined : numQty,
    });
    if (!result.success) {
      const formErrors: { rawMaterialId?: string; requiredQuantity?: string } = {};
      result.error.issues.forEach((err) => {
        const path = err.path[0] as string;
        if (path in formErrors) return;
        formErrors[path as keyof typeof formErrors] = err.message;
      });
      setAddFieldErrors(formErrors);
      return;
    }
    dispatch(addProductMaterial({ productId: Number(productId), rawMaterialId: Number(addRawMaterialId), requiredQuantity: result.data.requiredQuantity }))
      .unwrap()
      .then(() => {
        toast.success('Material added to product.');
        setAddRawMaterialId('');
        setAddQuantity('');
        setAddFieldErrors({});
      })
      .catch((err: unknown) => {
        toast.error(getErrorMessage(err));
      });
  };

  const startEdit = (row: ProductMaterialDto) => {
    setEditingId(row.id);
    setEditQuantity(String(row.requiredQuantity));
  };

  const saveEdit = () => {
    if (editingId == null) return;
    const row = itemsList.find((m) => m.id === editingId);
    if (!row) return;
    setEditQuantityError(null);
    const qty = editQuantity === '' ? NaN : Number(editQuantity);
    const parsed = requiredQuantitySchema.safeParse(Number.isNaN(qty) ? undefined : qty);
    if (!parsed.success) {
      setEditQuantityError(parsed.error.issues[0]?.message ?? 'Required quantity must be greater than 0');
      return;
    }
    dispatch(
      updateProductMaterial({
        productId: Number(productId),
        id: editingId,
        rawMaterialId: row.rawMaterialId,
        requiredQuantity: parsed.data,
      })
    )
      .unwrap()
      .then(() => {
        toast.success('Material updated.');
        setEditingId(null);
        setEditQuantity('');
        setEditQuantityError(null);
      })
      .catch((err: unknown) => {
        toast.error(getErrorMessage(err));
      });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditQuantity('');
    setEditQuantityError(null);
  };

  const handleRemove = async (id: number, code: string) => {
    const confirmed = await showConfirm(`Remove "${code}" from this product?`);
    if (!confirmed) return;

    dispatch(deleteProductMaterial({ productId: Number(productId), id }))
      .unwrap()
      .then(() => toast.success('Material removed from product.'))
      .catch((err: unknown) => {
        toast.error(getErrorMessage(err));
      });
  };

  if (!productId) return null;

  const addDisabled = !addRawMaterialId || !addQuantity || Number(addQuantity) <= 0;

  return (
    <div className="product-materials-section">
      <h2 className="section-title">Raw materials (recipe)</h2>
      {error && (
        <p className="error" role="alert">
          {error}
          <button type="button" className="btn btn-secondary" onClick={() => dispatch(clearError())}>
            Dismiss
          </button>
        </p>
      )}
      {editingId != null && editQuantityError && (
        <p className="field-error" role="alert" id="edit-quantity-error">
          {editQuantityError}
        </p>
      )}
      {loading && itemsList.length === 0 ? (
        <p className="loading">Loading materials…</p>
      ) : (
        <>
          <ProductMaterialsTable
            items={itemsList}
            editingId={editingId}
            editQuantity={editQuantity}
            editQuantityError={editQuantityError}
            onEditQuantityChange={setEditQuantity}
            onStartEdit={startEdit}
            onSaveEdit={saveEdit}
            onCancelEdit={cancelEdit}
            onRemove={handleRemove}
          />
          <AddProductMaterialForm
            availableRawMaterials={availableRawMaterials}
            rawMaterialId={addRawMaterialId}
            quantity={addQuantity}
            onRawMaterialIdChange={setAddRawMaterialId}
            onQuantityChange={setAddQuantity}
            onSubmit={handleAdd}
            isDisabled={addDisabled}
            rawMaterialIdError={addFieldErrors.rawMaterialId}
            quantityError={addFieldErrors.requiredQuantity}
          />
        </>
      )}
    </div>
  );
}
