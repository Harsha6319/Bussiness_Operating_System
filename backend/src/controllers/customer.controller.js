import fs from 'fs';
import csv from 'csv-parser';
import { Customer } from '../models/Customer.js';
import { Order } from '../models/Order.js';
import { crudController } from './crud.controller.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { logActivity } from '../services/activity.service.js';
import { nextScopedCode } from '../utils/sequence.js';

const base = crudController(Customer, 'Customer', ['name', 'email', 'phone', 'customerId'], {
  beforeCreate: async (payload, req) => {
    const duplicate = await Customer.findOne({
      organizationId: req.organizationId,
      deletedAt: { $exists: false },
      $or: [
        ...(payload.email ? [{ email: payload.email }] : []),
        ...(payload.phone ? [{ phone: payload.phone }] : [])
      ]
    });
    if (duplicate) throw new ApiError(409, 'A customer with the same email or phone already exists');
    payload.customerId = await nextScopedCode(Customer, req.organizationId, 'customerId', 'CUS');
  },
  afterCreate: (item, req) => logActivity({ organizationId: req.organizationId, actor: req.user._id, action: 'Customer Created', entity: 'Customer', entityId: item._id }),
  afterUpdate: (item, req) => logActivity({ organizationId: req.organizationId, actor: req.user._id, action: 'Customer Updated', entity: 'Customer', entityId: item._id }),
  afterRemove: (item, req) => logActivity({ organizationId: req.organizationId, actor: req.user._id, action: 'Customer Deleted', entity: 'Customer', entityId: item._id })
});

export const listCustomers = base.list;
export const createCustomer = base.create;
export const updateCustomer = base.update;
export const deleteCustomer = base.remove;

export const getCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findOne({ _id: req.params.id, organizationId: req.organizationId, deletedAt: { $exists: false } });
  if (!customer) throw new ApiError(404, 'Customer not found');
  const purchaseHistory = await Order.find({ organizationId: req.organizationId, customer: customer._id, deletedAt: { $exists: false } }).sort('-createdAt').limit(25);
  const timeline = purchaseHistory.map((order) => ({
    label: `Order ${order.orderNumber}`,
    amount: order.total,
    status: order.status,
    date: order.createdAt
  }));
  res.json({ data: customer, purchaseHistory, timeline, outstandingBalance: customer.outstandingBalance });
});

export const exportCustomers = asyncHandler(async (req, res) => {
  const customers = await Customer.find({ organizationId: req.organizationId, deletedAt: { $exists: false } }).sort('name');
  const rows = ['Customer ID,Name,Phone,Email,Type,Status,Outstanding Balance'];
  for (const customer of customers) {
    rows.push([customer.customerId, customer.name, customer.phone || '', customer.email || '', customer.customerType, customer.status, customer.outstandingBalance].join(','));
  }
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="customers.csv"');
  res.send(rows.join('\n'));
});

export const importCustomers = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'Please upload a CSV file');
  }

  const results = [];
  const errors = [];
  
  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', async () => {
      let imported = 0;
      for (const row of results) {
        try {
          const name = row.Name || row.name;
          const email = row.Email || row.email;
          const phone = row.Phone || row.phone;
          const type = row.Type || row.type || 'Individual';
          
          if (!name) {
            errors.push(`Row missing name: ${JSON.stringify(row)}`);
            continue;
          }

          const duplicate = await Customer.findOne({
            organizationId: req.organizationId,
            deletedAt: { $exists: false },
            $or: [
              ...(email ? [{ email }] : []),
              ...(phone ? [{ phone }] : [])
            ]
          });

          if (duplicate) {
            errors.push(`Duplicate skipped: ${name} (${email || phone})`);
            continue;
          }

          const customerId = await nextScopedCode(Customer, req.organizationId, 'customerId', 'CUS');
          
          const newCustomer = await Customer.create({
            organizationId: req.organizationId,
            customerId,
            name,
            email,
            phone,
            customerType: type,
            createdBy: req.user._id
          });
          
          logActivity({ organizationId: req.organizationId, actor: req.user._id, action: 'Customer Created', entity: 'Customer', entityId: newCustomer._id });
          imported++;
        } catch (error) {
          errors.push(`Failed to import ${row.Name || row.name}: ${error.message}`);
        }
      }
      
      fs.unlinkSync(req.file.path);
      res.json({ message: 'Import completed', imported, errors });
    })
    .on('error', (err) => {
      fs.unlinkSync(req.file.path);
      res.status(500).json({ message: 'Error parsing CSV', error: err.message });
    });
});
