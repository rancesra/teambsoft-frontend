<script setup>
// Muestra un ErrorApi. Decide qué decir según el CÓDIGO, nunca según el texto del mensaje: el texto
// puede cambiar sin avisar, el código es parte del contrato (sección 4).
const props = defineProps({ error: { type: Object, required: true } })
defineEmits(['reintentar'])

const TEXTOS = {
  SIN_CONEXION: 'No se pudo conectar con el servidor.',
  PRODUCTO_NO_ENCONTRADO: 'Este producto no existe o fue retirado del catálogo.',
  VALIDACION_FALLIDA: 'Hay datos incorrectos en el formulario.',
  STOCK_INSUFICIENTE: 'No hay unidades suficientes de algún producto.',
}

const texto = () => TEXTOS[props.error.codigo] ?? props.error.mensaje
</script>

<template>
  <div class="error" role="alert">
    <strong>{{ texto() }}</strong>
    <p v-if="error.codigo === 'VALIDACION_FALLIDA'">{{ error.mensaje }}</p>
    <button v-if="error.codigo === 'SIN_CONEXION'" class="boton secundario" @click="$emit('reintentar')">
      Reintentar
    </button>
  </div>
</template>

<style scoped>
.error {
  background: var(--error-suave);
  border-left: 3px solid var(--error);
  border-radius: 0 var(--radio-chico) var(--radio-chico) 0;
  padding: 14px 16px;
  color: #991b1b;
}

p {
  margin: 6px 0 0;
  font-size: 14px;
}

button {
  margin-top: 10px;
}
</style>