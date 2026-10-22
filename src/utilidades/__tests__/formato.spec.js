import { describe, expect, it } from 'vitest'
import { enPesos, nombreDeCategoria } from '../formato'

const categorias = [
  { id: 'cat-ropa', nombre: 'ropa' },
  { id: 'cat-hogar', nombre: 'hogar' },
]

describe('enPesos', () => {
  it('usa punto de miles', () => {
    expect(enPesos(49900)).toMatch(/49\.900/)
  })

  it('no muestra centavos', () => {
    expect(enPesos(49900)).not.toMatch(/,/)
  })
})

describe('nombreDeCategoria', () => {
  it('devuelve el nombre cuando encuentra el id', () => {
    expect(nombreDeCategoria('cat-ropa', categorias)).toBe('ropa')
  })

  it('devuelve el propio id si no lo encuentra', () => {
    expect(nombreDeCategoria('cat-inexistente', categorias)).toBe('cat-inexistente')
  })

  it('devuelve el id si la lista de categorías está vacía', () => {
    expect(nombreDeCategoria('cat-ropa', [])).toBe('cat-ropa')
  })
})
