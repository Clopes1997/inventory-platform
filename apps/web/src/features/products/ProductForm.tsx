import { useEffect, useState, FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { fetchProductById, createProduct, updateProduct, clearCurrent, clearError } from './productsSlice';
import ProductMaterialsSection from '../productMaterials/ProductMaterialsSection';
import { useAppDispatch, useAppSelector } from '../../store';
import type { ProductDto } from '../../types/api';
import toast from 'react-hot-toast';
import { productSchema } from '../../validation/schemas';
import FieldError from '../../components/FieldError';
import { getErrorMessage } from '../../utils/errorMessage';
import CatalogFields from '../catalog/CatalogFields';

const MAX_CODE_NAME_LENGTH = 255;

export default function ProductForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { current, error } = useAppSelector((state) => state.products);

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [catalog, setCatalog] = useState<Partial<ProductDto>>({ available: true, finishedStock: 0 });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ code?: string; name?: string; price?: string }>({});

  useEffect(() => {
    if (isEdit && id) {
      dispatch(fetchProductById(id));
    }
    return () => { dispatch(clearCurrent()); };
  }, [dispatch, isEdit, id]);

  useEffect(() => {
    if (current) {
      setCode(current.code ?? '');
      setName(current.name ?? '');
      setPrice(String(current.price ?? ''));
      setCatalog({ description: current.description, categoryPath: current.categoryPath,
        available: current.available ?? true, finishedStock: current.finishedStock ?? 0,
        brandId: current.brandId, cityId: current.cityId, version: current.version });
    }
  }, [current]);

  useEffect(() => {
    return () => { dispatch(clearError()); };
  }, [dispatch]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    const numPrice = price === '' ? NaN : Number(price);
    const result = productSchema.safeParse({
      code: code.trim(),
      name: name.trim(),
      price: Number.isNaN(numPrice) ? undefined : numPrice,
    });
    if (!result.success) {
      const formErrors: { code?: string; name?: string; price?: string } = {};
      result.error.issues.forEach((err) => {
        const path = err.path[0] as string;
        if (path in formErrors) return;
        formErrors[path as keyof typeof formErrors] = err.message;
      });
      setFieldErrors(formErrors);
      return;
    }
    if (!Number.isSafeInteger(catalog.finishedStock) || Number(catalog.finishedStock) < 0) {
      toast.error('Finished stock must be a nonnegative whole number.');
      return;
    }
    const payload = { ...result.data, ...catalog };
    setIsSubmitting(true);
    const thunk = isEdit
      ? dispatch(updateProduct({ id: Number(id), ...payload }))
      : dispatch(createProduct(payload));
    thunk
      .unwrap()
      .then((data: ProductDto) => {
        toast.success(isEdit ? 'Product updated.' : 'Product created.');
        if (isEdit) navigate('/products');
        else navigate(`/products/${data.id}/edit`);
      })
      .catch((err: unknown) => {
        toast.error(getErrorMessage(err));
      })
      .finally(() => setIsSubmitting(false));
  };

  return (
    <div className="page-container">
      <div className="page-card">
        <h1 className="page-title">{isEdit ? 'Edit Product' : 'New Product'}</h1>
        <Link to="/products" className="btn btn-secondary back-link">
          Back to list
        </Link>
        {error && <p className="error" role="alert">Error: {error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="product-code">Code</label>
          <input
            id="product-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            maxLength={MAX_CODE_NAME_LENGTH}
            aria-invalid={Boolean(fieldErrors.code)}
            aria-describedby={fieldErrors.code ? 'product-code-error' : undefined}
          />
            <FieldError id="product-code-error" message={fieldErrors.code} />
          </div>
          <div className="form-group">
            <label htmlFor="product-name">Name</label>
          <input
            id="product-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={MAX_CODE_NAME_LENGTH}
            aria-invalid={Boolean(fieldErrors.name)}
            aria-describedby={fieldErrors.name ? 'product-name-error' : undefined}
          />
            <FieldError id="product-name-error" message={fieldErrors.name} />
          </div>
          <div className="form-group">
            <label htmlFor="product-price">Price</label>
          <input
            id="product-price"
            type="number"
            step="0.01"
            min="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            aria-invalid={Boolean(fieldErrors.price)}
            aria-describedby={fieldErrors.price ? 'product-price-error' : undefined}
          />
            <FieldError id="product-price-error" message={fieldErrors.price} />
          </div>
          <CatalogFields value={catalog} onChange={setCatalog} />
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : isEdit ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
        {isEdit && id && <ProductMaterialsSection productId={id} />}
      </div>
    </div>
  );
}
