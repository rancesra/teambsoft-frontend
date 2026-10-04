<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import { api } from '@/api/cliente'
import MensajeError from '@/componentes/MensajeError.vue'

const props = defineProps({ id: { type: String, default: null } })

const router = useRouter()
const editando = computed(() => props.id !== null)

const categorias = ref([])
const cargando = ref(true)
const guardando = ref(false)
const error = ref(null)
const activo = ref(true)

// Un solo objeto con el formulario: así el envío es una línea y no hay que acordarse de cada campo.
const formulario = ref({
  nombre: '',
  descripcion: '',
  precio: '',
  categoria: '',
  stock: '',
  imagenes: '',
})

// Errores por campo. El backend manda "precio: debe ser mayor que 0"; aquí se parte en dos para
// poder pintarlo debajo del campo que falló en vez de en una alerta genérica arriba.
const errores = ref({})

function validar() {
  const e = {}
  const f = formulario.value

  if (!f.nombre.trim()) e.nombre = 'es obligatorio'
  else if (f.nombre.length > 120) e.nombre = 'no puede pasar de 120 caracteres'

  if (f.precio === '' || Number(f.precio) <= 0) e.precio = 'debe ser mayor que 0'
  if (f.stock === '' || Number(f.stock) < 0) e.stock = 'no puede ser negativo'
  if (!f.categoria) e.categoria = 'es obligatoria'

  errores.value = e
  return Object.keys(e).length === 0
}

async function cargar() {
  cargando.value = true
  error.value = null
  try {
    categorias.value = await api.get('/categorias')

    if (editando.value) {
      const p = await api.get(`/productos/${props.id}`)
      activo.value = p.activo
      formulario.value = {
        nombre: p.nombre,
        descripcion: p.descripcion ?? '',
        precio: String(p.precio),
        categoria: p.categoria,
        stock: String(p.stock),
        imagenes: (p.imagenes ?? []).join('\n'),
      }
    }
  } catch (e) {
    error.value = e
  } finally {
    cargando.value = false
  }
}

async function guardar() {
  if (!validar()) return

  guardando.value = true
  error.value = null
  errores.value = {}

  // PUT reemplaza el producto completo (contrato §2): se envían todos los campos, no solo los que
  // cambiaron. Omitir la descripción la borraría.
  const cuerpo = {
    nombre: formulario.value.nombre.trim(),
    descripcion: formulario.value.descripcion.trim() || null,
    precio: Number(formulario.value.precio),
    categoria: formulario.value.categoria,
    stock: Number(formulario.value.stock),
    imagenes: formulario.value.imagenes
      .split('\n')
      .map((u) => u.trim())
      .filter(Boolean),
  }

  try {
    if (editando.value) {
      await api.put(`/productos/${props.id}`, cuerpo)
    } else {
      await api.post('/productos', cuerpo)
    }
    router.push('/catalogo/admin')
  } catch (e) {
    // La validación del navegador solo avisa rápido; la que manda es la del backend.
    if (e.codigo === 'VALIDACION_FALLIDA') {
      const [campo, ...resto] = e.mensaje.split(': ')
      if (resto.length > 0 && campo in formulario.value) {
        errores.value = { [campo]: resto.join(': ') }
      } else {
        error.value = e
      }
    } else {
      error.value = e
    }
  } finally {
    guardando.value = false
  }
}

watch(() => props.id, cargar, { immediate: true })
</script>

<template>
  <h1>{{ editando ? 'Editar producto' : 'Nuevo producto' }}</h1>

  <p v-if="cargando" class="cargando">Cargando…</p>

  <template v-else>
    <MensajeError v-if="error" :error="error" @reintentar="cargar" />

    <!--
      Editar un producto retirado es válido: PUT no cambia el estado (contrato §2, Historia 4).
      Hay que avisarlo para que nadie crea que al guardar lo está volviendo a publicar.
    -->
    <div v-if="editando && !activo" class="retirado">
      <strong>Este producto está retirado.</strong>
      Guardar los cambios no lo vuelve a publicar: para eso está el botón Reactivar del listado.
    </div>

    <form class="formulario tarjeta" @submit.prevent="guardar">
      <label>
        Nombre
        <input v-model="formulario.nombre" class="campo" :class="{ malo: errores.nombre }" maxlength="120" />
        <small v-if="errores.nombre" class="mal">nombre: {{ errores.nombre }}</small>
        <small v-else>{{ formulario.nombre.length }} / 120 caracteres</small>
      </label>

      <label>
        Descripción
        <textarea v-model="formulario.descripcion" class="campo" rows="3"></textarea>
        <small>Opcional</small>
      </label>

      <div class="dos">
        <label>
          Precio
          <input v-model="formulario.precio" class="campo" :class="{ malo: errores.precio }" type="number" min="1" />
          <small v-if="errores.precio" class="mal">precio: {{ errores.precio }}</small>
          <small v-else>Mayor que 0</small>
        </label>

        <label>
          Stock
          <input v-model="formulario.stock" class="campo" :class="{ malo: errores.stock }" type="number" min="0" />
          <small v-if="errores.stock" class="mal">stock: {{ errores.stock }}</small>
          <small v-else>0 o más</small>
        </label>
      </div>

      <label>
        Categoría
        <select v-model="formulario.categoria" class="campo" :class="{ malo: errores.categoria }">
          <option value="">Elige una categoría</option>
          <option v-for="c in categorias" :key="c.id" :value="c.id">{{ c.nombre }}</option>
        </select>
        <small v-if="errores.categoria" class="mal">categoría: {{ errores.categoria }}</small>
        <small v-else>Las opciones vienen de GET /categorias</small>
      </label>

      <label>
        Imágenes
        <textarea v-model="formulario.imagenes" class="campo" rows="3" placeholder="https://..."></textarea>
        <small>Opcional · una URL por línea</small>
      </label>

      <div class="acciones">
        <button class="boton" type="submit" :disabled="guardando">
          {{ guardando ? 'Guardando…' : 'Guardar producto' }}
        </button>
        <button class="boton secundario" type="button" @click="router.push('/catalogo/admin')">
          Cancelar
        </button>
      </div>
    </form>
  </template>
</template>

<style scoped>
h1 {
  font-size: 24px;
  letter-spacing: -0.02em;
}

.formulario {
  padding: 26px;
  max-width: 640px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

label {
  display: block;
  font-size: 13px;
  font-weight: 600;
}

label .campo {
  margin-top: 6px;
}

small {
  display: block;
  font-size: 12px;
  color: var(--texto-suave);
  margin-top: 5px;
  font-weight: 400;
}

small.mal {
  color: var(--error);
  font-weight: 500;
}

.dos {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.acciones {
  display: flex;
  gap: 10px;
  border-top: 1px solid var(--borde);
  padding-top: 20px;
}

.retirado {
  background: #fdf4e6;
  border: 1px solid #ebd3a6;
  color: var(--aviso);
  border-radius: var(--radio-chico);
  padding: 12px 15px;
  font-size: 14px;
  margin-bottom: 18px;
  max-width: 640px;
}

.cargando {
  color: var(--texto-suave);
}

@media (max-width: 600px) {
  .dos {
    grid-template-columns: 1fr;
  }
}
</style>