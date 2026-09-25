import { useEffect, useState, FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  fetchRawMaterialById,
  createRawMaterial,
  updateRawMaterial,
  clearCurrent,
  clearError,
} from './rawMaterialsSlice';
import { useAppDispatch, useAppSelector } from '../../store';
import type { RawMaterialDto } from '../../types/api';
import toast from 'react-hot-toast';
import { rawMaterialSchema } from '../../validation/schemas';
import FieldError from '../../components/FieldError';
import { getErrorMessage } from '../../utils/errorMessage';

const MAX_CODE_NAME_LENGTH = 255;

export default function RawMaterialForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { current, error } = useAppSelector((state) => state.rawMaterials);

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [stockQuantity, setStockQuantity] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ code?: string; name?: string; stockQuantity?: string }>({});

  useEffect(() => {
    if (isEdit && id) {
      dispatch(fetchRawMaterialById(id));
    }
    return () => { dispatch(clearCurrent()); };
  }, [dispatch, isEdit, id]);

  useEffect(() => {
    if (current) {
      setCode(current.code ?? '');
      setName(current.name ?? '');
      setStockQuantity(String(current.stockQuantity ?? ''));
    }
  }, [current]);

  useEffect(() => {
    return () => { dispatch(clearError()); };
  }, [dispatch]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    const numStock = stockQuantity === '' ? NaN : Number(stockQuantity);
    const result = rawMaterialSchema.safeParse({
      code: code.trim(),
      name: name.trim(),
      stockQuantity: Number.isNaN(numStock) ? undefined : numStock,
    });
    if (!result.success) {
      const formErrors: { code?: string; name?: string; stockQuantity?: string } = {};
      result.error.issues.forEach((err) => {
        const path = err.path[0] as string;
        if (path in formErrors) return;
        formErrors[path as keyof typeof formErrors] = err.message;
      });
      setFieldErrors(formErrors);
      return;
    }
    const payload = result.data;
    setIsSubmitting(true);
    const thunk = isEdit
      ? dispatch(updateRawMaterial({ id: Number(id), ...payload }))
      : dispatch(createRawMaterial(payload));
    thunk
      .unwrap()
      .then((data: RawMaterialDto) => {
        toast.success(isEdit ? 'Raw material updated.' : 'Raw material created.');
        if (isEdit) navigate('/raw-materials');
        else navigate(`/raw-materials/${data.id}/edit`);
      })
      .catch((err: unknown) => {
        toast.error(getErrorMessage(err));
      })
      .finally(() => setIsSubmitting(false));
  };

  return (
    <div className="page-container">
      <div className="page-card">
        <h1 className="page-title">{isEdit ? 'Edit Raw Material' : 'New Raw Material'}</h1>
        <Link to="/raw-materials" className="btn btn-secondary back-link">
          Back to list
        </Link>
        {error && <p className="error" role="alert">Error: {error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="raw-material-code">Code</label>
          <input
            id="raw-material-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            maxLength={MAX_CODE_NAME_LENGTH}
            aria-invalid={Boolean(fieldErrors.code)}
            aria-describedby={fieldErrors.code ? 'raw-material-code-error' : undefined}
          />
          <FieldError id="raw-material-code-error" message={fieldErrors.code} />
        </div>
        <div className="form-group">
          <label htmlFor="raw-material-name">Name</label>
          <input
            id="raw-material-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={MAX_CODE_NAME_LENGTH}
            aria-invalid={Boolean(fieldErrors.name)}
            aria-describedby={fieldErrors.name ? 'raw-material-name-error' : undefined}
          />
          <FieldError id="raw-material-name-error" message={fieldErrors.name} />
        </div>
        <div className="form-group">
          <label htmlFor="raw-material-stock">Stock quantity</label>
          <input
            id="raw-material-stock"
            type="number"
            step="any"
            min="0"
            value={stockQuantity}
            onChange={(e) => setStockQuantity(e.target.value)}
            aria-invalid={Boolean(fieldErrors.stockQuantity)}
            aria-describedby={fieldErrors.stockQuantity ? 'raw-material-stock-error' : undefined}
          />
          <FieldError id="raw-material-stock-error" message={fieldErrors.stockQuantity} />
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : isEdit ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
