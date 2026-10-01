export function enPesos(valor) {
  if (valor == null) return '$0';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  }).format(valor);
}

export function nombreDeCategoria(idCategoria, categorias) {
  if (!categorias || categorias.length === 0) return '...';
  const categoria = categorias.find((c) => c.id === idCategoria);
  return categoria ? categoria.nombre : 'Sin categoría';
}