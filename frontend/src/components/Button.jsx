export function Button({ variant = 'primary', className = '', ...props }) {
  const styles = variant === 'secondary' ? 'btn-secondary' : 'btn-primary';
  return <button className={`${styles} ${className}`} {...props} />;
}
