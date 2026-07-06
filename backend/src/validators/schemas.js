import { z } from 'zod';
import { ROLES } from '../constants/roles.js';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');
const money = z.coerce.number().min(0);

export const authSchemas = {
  register: z.object({
    body: z.object({
      businessName: z.string().min(2),
      name: z.string().min(2),
      email: z.string().email(),
      password: z.string().min(8)
    })
  }),
  login: z.object({ body: z.object({ email: z.string().email(), password: z.string().min(8) }) }),
  forgotPassword: z.object({ body: z.object({ email: z.string().email() }) }),
  resetPassword: z.object({ body: z.object({ token: z.string().min(20), password: z.string().min(8) }) }),
  inviteUser: z.object({
    body: z.object({
      name: z.string().min(2),
      email: z.string().email(),
      password: z.string().min(8),
      role: z.enum([ROLES.MANAGER, ROLES.EMPLOYEE, ROLES.CUSTOMER])
    })
  })
};

export const customerSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    phone: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
    address: z.object({
      line1: z.string().optional(),
      line2: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      postalCode: z.string().optional(),
      country: z.string().optional()
    }).optional(),
    notes: z.string().optional(),
    gstNumber: z.string().optional(),
    customerType: z.enum(['Individual', 'Business']).optional(),
    status: z.enum(['Active', 'Inactive']).optional(),
    tags: z.array(z.string()).optional()
  })
});

export const productSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    description: z.string().optional(),
    sku: z.string().optional(),
    category: z.string().optional(),
    stockQuantity: z.coerce.number().int().min(0),
    lowStockThreshold: z.coerce.number().int().min(0).optional(),
    maximumStock: z.coerce.number().int().min(0).optional(),
    price: money,
    costPrice: money.optional(),
    sellingPrice: money.optional(),
    purchasePrice: money.optional(),
    barcode: z.string().optional(),
    qrCode: z.string().optional(),
    imageUrl: z.string().url().optional().or(z.literal('')),
    supplier: z.string().optional(),
    warehouse: z.string().optional(),
    expiryDate: z.coerce.date().optional()
  })
});

export const orderSchema = z.object({
  body: z.object({
    customer: objectId,
    items: z.array(z.object({ product: objectId, quantity: z.coerce.number().int().min(1), discount: money.optional(), tax: money.optional() })).min(1),
    tax: money.optional(),
    discount: money.optional(),
    paymentStatus: z.enum(['Pending', 'Paid', 'Partial', 'Refunded', 'Unpaid']).optional(),
    notes: z.string().optional()
  })
});

export const orderStatusSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({
    status: z.enum(['Draft', 'Pending', 'Confirmed', 'Packed', 'Shipped', 'Delivered', 'Cancelled']).optional(),
    paymentStatus: z.enum(['Pending', 'Paid', 'Partial', 'Refunded', 'Unpaid']).optional()
  })
});

export const transactionSchema = z.object({
  body: z.object({
    type: z.enum(['Income', 'Expense']),
    category: z.string().min(2),
    reference: z.string().optional(),
    amount: money,
    paymentMethod: z.enum(['Cash', 'UPI', 'Card', 'Bank']).optional(),
    description: z.string().optional(),
    invoiceNumber: z.string().optional(),
    occurredAt: z.coerce.date().optional()
  })
});

export const stockAdjustmentSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({
    quantity: z.coerce.number().int(),
    reason: z.string().optional()
  })
});

export const settingsSchema = z.object({
  body: z.object({
    businessName: z.string().min(2),
    businessLogo: z.string().optional(),
    profile: z.object({
      industry: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().email().optional().or(z.literal('')),
      address: z.string().optional(),
      currency: z.string().min(3).max(3).optional()
    }).optional(),
    theme: z.enum(['light', 'dark', 'system']).optional(),
    notifications: z.object({
      lowStock: z.boolean().optional(),
      dailySummary: z.boolean().optional(),
      invoiceReminders: z.boolean().optional()
    }).optional()
  })
});

export const idParamSchema = z.object({ params: z.object({ id: objectId }) });
export const aiChatSchema = z.object({
  body: z.object({
    message: z.string().min(2).max(4000),
    conversationId: objectId.nullish(),
    mode: z.enum(['business', 'rag', 'advisor']).optional()
  })
});

export const conversationUpdateSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({
    title: z.string().min(1).max(100).optional(),
    isPinned: z.boolean().optional()
  })
});

export const ragQuestionSchema = z.object({
  body: z.object({
    question: z.string().min(2).max(2000),
    topK: z.coerce.number().int().min(1).max(10).optional()
  })
});

export const reportRequestSchema = z.object({
  body: z.object({
    type: z.enum(['sales', 'inventory', 'customer', 'finance', 'orders', 'business', 'weekly', 'monthly']),
    format: z.enum(['markdown', 'text', 'pdf']).optional()
  })
});

export const agentRunSchema = z.object({
  body: z.object({
    workflow: z.enum(['low-stock', 'large-expense', 'new-order']).or(z.string().min(2).max(80))
  })
});
