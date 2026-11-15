<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

import { enPesos, nombreDeCategoria } from '@/utilidades/formato'
import { estaEmbebido, pedirNavegacion } from '@/utilidades/hostApp'

const props = defineProps({
  producto: { type: Object, required: true },
  categorias: { type: Array, default: () => [] },
})

// El stock es un número del contrato; estas tres variantes son decisión nuestra de interfaz.
const estadoStock = computed(() => {
  if (props.producto.stock === 0) return { clase: 'sin', texto: 'Sin stock' }
  if (props.producto.stock <= 10) return { clase: 'poco', texto: `Quedan ${props.producto.stock}` }
  return { clase: 'hay', texto: `${props.producto.stock} disponibles` }
})

// Las mismas tres condiciones del botón del detalle (contrato v2.8, sección 9): activo, con stock y
// dentro del Host App. Fuera del Host App no hay carrito al cual llevar al usuario.
const puedeAgregarAlCarro = computed(
  () => estaEmbebido() && props.producto.activo !== false && props.producto.stock > 0,
)

function agregarAlCarro() {
  pedirNavegacion(`/carrito?agregar=${encodeURIComponent(props.producto.id)}`)
}
</script>

<template>
  <!-- La tarjeta no es un enlace entero: dentro de un enlace no puede ir un botón. El enlace cubre la
       foto y los datos, y el botón queda aparte, abajo. -->
  <article class="producto tarjeta">
    <RouterLink class="enlace" :to="`/catalogo/${producto.id}`">
      <div class="foto">
        <img v-if="producto.imagenes?.length" :src="producto.imagenes[0]" :alt="producto.nombre" />
        <span v-else class="sin-foto">sin imagen</span>
      </div>

      <div class="cuerpo">
        <span class="categoria">{{ nombreDeCategoria(producto.categoria, categorias) }}</span>
        <h3>{{ producto.nombre }}</h3>
        <p class="precio">{{ enPesos(producto.precio) }}</p>
        <span class="stock" :class="estadoStock.clase">{{ estadoStock.texto }}</span>
      </div>
    </RouterLink>

    <button v-if="puedeAgregarAlCarro" class="agregar" @click="agregarAlCarro">Agregar al carro</button>
  </article>
</template>

<style scoped>
.producto {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.enlace {
  display: flex;
  flex-direction: column;
  flex: 1;
  text-decoration: none;
  color: inherit;
}

/* Secundario a propósito: la acción principal de la tarjeta sigue siendo abrir el producto. */
.agregar {
  margin: 0 14px 14px;
  border: 1px solid var(--acento);
  background: var(--superficie);
  color: var(--acento);
  border-radius: var(--radio-chico);
  padding: 8px 10px;
  font: 600 13px var(--fuente);
  cursor: pointer;
}

.agregar:hover {
  background: var(--acento);
  color: var(--texto-sobre-acento);
}

/* El recuadro mide siempre 4:3, tenga foto o no, para que las tarjetas de una fila queden parejas.
   La foto va posicionada encima: si fuera contenido normal, una foto cuadrada estiraría el recuadro
   (el tamaño mínimo del contenido le gana a aspect-ratio). */
.foto {
  position: relative;
  aspect-ratio: 4 / 3;
  background: var(--fondo-suave);
  display: grid;
  place-items: center;
}

/* contain y no cover: se ve el producto completo, sin recortarlo. */
.foto img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.sin-foto {
  font-size: 11px;
  color: var(--texto-suave);
  letter-spacing: 0.06em;
}

.cuerpo {
  padding: 13px 14px 15px;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.categoria {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--texto-suave);
  font-weight: 600;
}

h3 {
  font-size: 14px;
  font-weight: 600;
  margin: 4px 0 auto;
  line-height: 1.35;
}

.precio {
  font-size: 19px;
  font-weight: 700;
  margin: 11px 0 0;
  font-variant-numeric: tabular-nums;
}

.stock {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 9px;
  border-radius: 999px;
  margin-top: 7px;
  width: fit-content;
}

.stock.hay {
  background: var(--acento-suave);
  color: var(--ok);
}

.stock.poco {
  background: var(--aviso-suave);
  color: var(--aviso);
}

.stock.sin {
  background: var(--fondo-suave);
  color: var(--texto-suave);
}

/* En el celular van dos tarjetas por fila (VistaListado), así que todo se achica un poco. */
@media (max-width: 520px) {
  .cuerpo {
    padding: 10px 10px 12px;
  }

  h3 {
    font-size: 13px;
  }

  .precio {
    font-size: 16px;
    margin-top: 8px;
  }

  .agregar {
    margin: 0 10px 10px;
    padding: 7px 6px;
    font-size: 12px;
  }
}
</style>
