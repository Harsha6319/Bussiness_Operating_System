export async function nextScopedCode(Model, organizationId, field, prefix) {
  const count = await Model.countDocuments({ organizationId });
  return `${prefix}-${String(count + 1).padStart(6, '0')}`;
}
