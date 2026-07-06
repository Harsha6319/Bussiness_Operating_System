import { ApiError } from '../utils/ApiError.js';

export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse({
    body: req.body,
    query: req.query,
    params: req.params
  });

  if (!result.success) {
    throw new ApiError(422, 'Validation failed', result.error.flatten());
  }

  req.validated = result.data;
  next();
};
