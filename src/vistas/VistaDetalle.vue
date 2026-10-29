<script setup>
import { ref, watch } from 'vue'
import { RouterLink } from 'vue-router'

import { api } from '@/api/cliente'
import MensajeError from '@/componentes/MensajeError.vue'
import { enPesos, nombreDeCategoria } from '@/utilidades/formato'

const props = defineProps({ id: { type: String, required: true } })

const producto = ref(null)
const categorias = ref([])
const cargando = ref(true)
const error = ref(null)
const imagenActual = ref(0)

async function cargar() {
  cargando.value = true
  error.value = null
  imagenActual.value = 0
  try {
    if (categorias.value.length === 0) {
      categorias.value = await api.get('/categorias')
    }
    producto.value = await api.get(`/productos/${props.id}`)
  } catch (e) {
    error.value = e
    producto.value = null
  } finally {
    cargando.value = false
  }
}

watch(() => props.id, cargar, { immediate: true })
</script>

<template>
  <p class="miga">
    <RouterLink to="/catalogo">Catálogo</RouterLink>
    <template v-if="producto"> · {{ nombreDeCategoria(producto.categoria, categorias) }}</template>
  </p>

  <MensajeError v-if="error" :error="error" @reintentar="cargar" />

  <div v-else-if="cargando" class="esqueleto-detalle">
    <div class="caja"></div>
    <div>
      <div class="linea ancha"></div>
      <div class="linea"></div>
      <div class="linea corta"></div>
    </div>
  </div>

  <article v-else-if="producto" class="detalle">
    <div>
      <div class="foto-grande" :class="{ retirado: !producto.activo }">
        <img
          v-if="producto.imagenes?.length"
          :src="producto.imagenes[imagenActual]"
          :alt="producto.nombre"
        />
        <span v-else class="sin-foto">sin imagen</span>
      </div>

      <!-- imagenes es una lista en el contrato, no una sola URL -->
      <div v-if="producto.imagenes?.length > 1" class="miniaturas">
        <button
          v-for="(url, i) in producto.imagenes"
          :key="url"
          class="miniatura"
          :class="{ actual: i === imagenActual }"
          @click="imagenActual = i"
        >
          <img :src="url" :alt="`Imagen ${i + 1}`" />
        </button>
      </div>
    </div>

    <div>
      <!--
        Un producto desactivado responde 200 con activo:false, no 404 (contrato §2). Por eso esta
        vista lo muestra en gris y sin llamada a la acción, en vez de fingir que nunca existió.
      -->
      <div v-if="!producto.activo" class="retirado-aviso">
        <strong>Producto no disponible.</strong> Este producto fue retirado del catálogo.
      </div>

      <h1 :class="{ apagado: !producto.activo }">{{ producto.nombre }}</h1>

      <span v-if="producto.activo" class="stock" :class="producto.stock === 0 ? 'sin' : 'hay'">
        {{ producto.stock === 0 ? 'Sin stock' : `${producto.stock} disponibles` }}
      </span>

      <p class="precio" :class="{ apagado: !producto.activo }">{{ enPesos(producto.precio) }}</p>

      <p v-if="producto.descripcion" class="descripcion">{{ producto.descripcion }}</p>

      <!--
        Espacio reservado para el módulo de Carro (Equipo C). No lo construimos nosotros: falta
        acordar si el botón lo pinta Catálogo o lo monta aquí el Host App.
      -->
      <div v-if="producto.activo && producto.stock > 0" class="espacio-carro">
        Espacio reservado · Carro (Equipo C)
      </div>
    </div>
  </article>
</template>

<style scoped>
.miga {
  font-size: 13px;
  color: var(--texto-suave);
  margin: 0 0 14px;
}

.miga a {
  color: var(--acento);
  text-decoration: none;
}

.detalle {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 36px;
}

.foto-grande {
  aspect-ratio: 1;
  background: var(--fondo-suave);
  border: 1px solid var(--borde);
  border-radius: var(--radio);
  display: grid;
  place-items: center;
  overflow: hidden;
}

.foto-grande.retirado {
  filter: grayscale(1);
  opacity: 0.65;
}

.foto-grande img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.sin-foto {
  font-size: 12px;
  color: var(--texto-suave);
}

.miniaturas {
  display: flex;
  gap: 10px;
  margin-top: 12px;
}

.miniatura {
  width: 62px;
  height: 62px;
  border: 1px solid var(--borde);
  border-radius: var(--radio-chico);
  overflow: hidden;
  padding: 0;
  background: none;
  cursor: pointer;
}

.miniatura.actual {
  border: 2px solid var(--acento);
}

.miniatura img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.retirado-aviso {
  background: var(--aviso-suave);
  border: 1px solid var(--aviso-borde);
  color: var(--aviso);
  border-radius: var(--radio-chico);
  padding: 10px 13px;
  font-size: 14px;
  margin-bottom: 14px;
}

h1 {
  font-size: 27px;
  letter-spacing: -0.025em;
  margin: 0 0 8px;
  line-height: 1.2;
}

h1.apagado,
.precio.apagado {
  color: var(--texto-suave);
}

.stock {
  font-size: 12px;
  font-weight: 600;
  padding: 2px 10px;
  border-radius: 999px;
}

.stock.hay {
  background: var(--acento-suave);
  color: var(--ok);
}

.stock.sin {
  background: var(--fondo-suave);
  color: var(--texto-suave);
}

.precio {
  font-size: 32px;
  font-weight: 700;
  letter-spacing: -0.03em;
  margin: 12px 0 0;
  font-variant-numeric: tabular-nums;
}

.descripcion {
  color: var(--texto-suave);
  font-size: 14px;
  border-top: 1px solid var(--borde);
  padding-top: 16px;
  margin-top: 16px;
}

.espacio-carro {
  margin-top: 20px;
  border: 2px dashed var(--aviso);
  border-radius: var(--radio-chico);
  padding: 16px;
  color: var(--aviso);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  text-align: center;
}

.esqueleto-detalle {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 36px;
}

.caja {
  aspect-ratio: 1;
  background: var(--fondo-suave);
  border-radius: var(--radio);
}

.linea {
  height: 16px;
  background: var(--fondo-suave);
  border-radius: 999px;
  margin-bottom: 12px;
}

.linea.ancha {
  height: 28px;
}

.linea.corta {
  width: 55%;
}

@media (max-width: 760px) {
  .detalle,
  .esqueleto-detalle {
    grid-template-columns: 1fr;
    gap: 22px;
  }
}
</style>
