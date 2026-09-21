# Guía de inicio — frontend del Catálogo (Windows)

Pasos para dejar tu computador listo y empezar a trabajar. Todos los comandos se ejecutan en **PowerShell**, la terminal por defecto de Windows y de VS Code.

> Esta guía es para el repositorio del **frontend** (tareas F1, F2 y F3). Si te toca backend (B1 a B4), tu repositorio es [teambsoft-backend](https://github.com/rancesra/teambsoft-backend) y tiene su propia guía: allá se instala JDK y Docker, aquí Node.js.

## 0. Acceso al repositorio

1. Necesitas una cuenta de GitHub.
2. Acepta la invitación de colaborador que te llegó por correo, o entra a https://github.com/rancesra/teambsoft-frontend/invitations. Sin aceptarla puedes descargar el repo, pero no subir cambios.

## 1. Instalar las herramientas

| Herramienta | Para qué |
|---|---|
| Git | Control de versiones |
| Node.js (LTS) | Ejecutar y compilar el proyecto de Vue |
| VS Code | Editor |

No hace falta instalar Vue ni Vite aparte: son dependencias del proyecto y las descarga `npm install`.

Instala en este orden:

1. **Git:** https://git-scm.com/downloads/win
   Deja las opciones por defecto. Dos de ellas importan:
   - *Checkout Windows-style, commit Unix-style line endings*: evita problemas de finales de línea con compañeros que usan Mac.
   - *Git Credential Manager*: es lo que te pedirá iniciar sesión en GitHub la primera vez que subas cambios.

2. **Node.js LTS:** https://nodejs.org
   Descarga el instalador `.msi` de la versión que dice **LTS** (soporte a largo plazo), no la "Current". Deja las opciones por defecto. `npm`, el instalador de paquetes que vas a usar todos los días, viene incluido.

3. **VS Code:** https://code.visualstudio.com/download
   Deja marcada la opción **Add to PATH**.

### Extensiones de VS Code

Abre Extensiones (`Ctrl+Shift+X`) e instala:

- **Vue - Official** (la oficial de Vue; antes se llamaba Volar). Da autocompletado y errores dentro de los archivos `.vue`.
- **ESLint** y **Prettier - Code formatter**: avisan de errores comunes y dejan el código con el mismo formato para todos, así los pull requests no se llenan de diferencias de espacios.

### Verificar

Cierra VS Code y cualquier terminal abierta, y vuelve a abrirlos para que reconozcan lo que instalaste. En PowerShell:

```powershell
git --version
node -v
npm -v
```

`node -v` debe mostrar una versión que empiece en un número par (por ejemplo `v22.x.x`): así son las versiones LTS.

## 2. Configurar Git (una sola vez)

Usa el correo registrado en tu cuenta de GitHub, para que tus commits aparezcan a tu nombre:

```powershell
git config --global user.name "Tu Nombre"
git config --global user.email "tu-correo@ejemplo.com"
```

Y dos ajustes que evitan problemas al trabajar en equipo (la [guía de git](GUIA-GIT.md) explica para qué sirve cada uno):

```powershell
git config --global pull.rebase false
git config --global core.editor "code --wait"
```

No tienes que iniciar sesión en GitHub ahora. La primera vez que hagas `git push` se abrirá el navegador para que autorices tu cuenta. Usa la misma cuenta con la que aceptaste la invitación.

## 3. Clonar el repositorio

*Clonar* es descargar el repositorio con todo su historial. Hazlo en una carpeta **fuera de OneDrive**: en muchos Windows, el Escritorio y Documentos se sincronizan con OneDrive, y eso bloquea archivos mientras Git o npm trabajan. Por ejemplo, en `C:\dev`:

```powershell
mkdir C:\dev
cd C:\dev
git clone https://github.com/rancesra/teambsoft-frontend.git
cd teambsoft-frontend
code .
```

`code .` abre la carpeta del proyecto en VS Code.

## 4. Arrancar el proyecto

**El proyecto de Vue todavía no existe.** Lo crea **F1** (Juan Diego) y, cuando su pull request entre a `main`, aparece en este repositorio.

**Si eres F1:** tu tarea empieza aquí. El plan de trabajo dice qué debe quedar listo; la herramienta oficial se ejecuta desde la carpeta del repositorio:

```powershell
npm create vue@latest
```

Cuando pregunte el nombre del proyecto, responde `.` (un punto) para crearlo en esta misma carpeta, en lugar de una carpeta anidada. Responde **sí a Vue Router** y **no a Pinia** (ver el plan). Después, `npm install` y `npm run dev`.

**Si eres F2 o F3:** espera a que la base de F1 esté en `main`. Cuando lo esté:

```powershell
git pull origin main
npm install
npm run dev
```

`npm install` lee el archivo `package.json` y descarga a la carpeta `node_modules` las librerías que el proyecto necesita. Esa carpeta **no se sube a git** (pesa cientos de MB y se regenera): por eso cada quien la crea en su computador con este comando.

`npm run dev` deja el proyecto corriendo en http://localhost:5173 y recarga el navegador solo cada vez que guardas un archivo. Para detenerlo, `Ctrl + C`.

## 5. Antes de programar

1. Lee el [contrato](https://github.com/rancesra/teambsoft-backend/blob/main/docs/CONTRATO-CATALOGO.md). Es el acuerdo con los equipos A y C: define los endpoints, qué devuelven y cómo llegan los errores. No se cambia sin consultarlo.
2. Abre el [mockup](docs/mockup-frontend-catalogo.html) en el navegador: ahí están las tres vistas con las reglas del contrato anotadas.
3. Busca tu tarea en el [plan de trabajo](https://github.com/rancesra/teambsoft-backend/blob/main/PLAN-DE-TRABAJO.md).
4. Lee la [guía de git](GUIA-GIT.md): cómo crear tu rama, qué hacer cada día y cómo entregar tu tarea con un pull request.
