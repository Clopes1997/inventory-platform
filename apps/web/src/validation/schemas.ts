import { z } from 'zod';

const MAX_CODE_NAME_LENGTH = 255;
const MIN_PASSWORD_LENGTH = 6;

export const productSchema = z.object({
  code: z.string().trim().min(1, 'Code is required').max(MAX_CODE_NAME_LENGTH, `Code must be at most ${MAX_CODE_NAME_LENGTH} characters`),
  name: z.string().trim().min(1, 'Name is required').max(MAX_CODE_NAME_LENGTH, `Name must be at most ${MAX_CODE_NAME_LENGTH} characters`),
  price: z.number().min(0, 'Price must be 0 or greater'),
});

export const rawMaterialSchema = z.object({
  code: z.string().trim().min(1, 'Code is required').max(MAX_CODE_NAME_LENGTH, `Code must be at most ${MAX_CODE_NAME_LENGTH} characters`),
  name: z.string().trim().min(1, 'Name is required').max(MAX_CODE_NAME_LENGTH, `Name must be at most ${MAX_CODE_NAME_LENGTH} characters`),
  stockQuantity: z.number().min(0, 'Stock quantity must be 0 or greater'),
});

export const loginSchema = z.object({
  username: z.string().trim().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export const userCreateSchema = z.object({
  username: z.string().trim().min(1, 'Username is required').max(MAX_CODE_NAME_LENGTH, `Username must be at most ${MAX_CODE_NAME_LENGTH} characters`),
  password: z.string().min(MIN_PASSWORD_LENGTH, `Password must be at least ${MIN_PASSWORD_LENGTH} characters`),
  role: z.enum(['ADMIN', 'OPERATOR', 'VIEWER']),
});

export const userUpdateSchema = z.object({
  username: z.string().trim().min(1, 'Username is required').max(MAX_CODE_NAME_LENGTH, `Username must be at most ${MAX_CODE_NAME_LENGTH} characters`),
  password: z.string().optional(),
  role: z.enum(['ADMIN', 'OPERATOR', 'VIEWER']).optional(),
}).refine(
  (data) => !data.password || data.password.length >= MIN_PASSWORD_LENGTH,
  { message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`, path: ['password'] }
);

export const requiredQuantitySchema = z.number().positive('Required quantity must be greater than 0');

export const addProductMaterialSchema = z.object({
  rawMaterialId: z.string().min(1, 'Select a raw material'),
  requiredQuantity: requiredQuantitySchema,
});

export type ProductFormValues = z.infer<typeof productSchema>;
export type RawMaterialFormValues = z.infer<typeof rawMaterialSchema>;
export type LoginFormValues = z.infer<typeof loginSchema>;
export type UserCreateFormValues = z.infer<typeof userCreateSchema>;
export type UserUpdateFormValues = z.infer<typeof userUpdateSchema>;
export type AddProductMaterialFormValues = z.infer<typeof addProductMaterialSchema>;
