# Iteración 1 · Ireth · TEC-01: Sistema visual y componentes

**Antes de empezar:** espera el PR de la base de Angie. Dentro de la iteración nadie depende de nadie: trabajen al mismo tiempo.

Extrae este zip en `C:\proyectos`; debe quedar `C:\proyectos\it1-ireth`. Mueve tu tarjeta a "En desarrollo". Los criterios están en `docs/BACKLOG.md`.

## Preparación (solo la primera vez)

Instala [Node.js 22.13 o superior](https://nodejs.org) (recomendado 24) y [Git](https://git-scm.com). Acepta la invitación al repositorio en tu correo.

```powershell
mkdir -Force C:\proyectos
cd C:\proyectos
git clone https://TU_USUARIO@github.com/USUARIO_DE_ANGIE/plataforma-gastronomica.git sazon
cd sazon
```

```powershell
git config user.name "Tu Nombre"
git config user.email "TU_CORREO_DE_GITHUB"
git config user.email
```

Queda **solo en este repositorio** (no uses `--global`). El correo debe estar en tu GitHub (Settings → Emails).

```powershell
git checkout develop
npm ci
```

## Rama

```powershell
cd C:\proyectos\sazon
git checkout develop
git pull
git checkout -b feature/tec-01-sistema-visual
```

## 1. Rojo: primero las pruebas

Deben **fallar**. Captúralo.

```powershell
Copy-Item -Recurse -Force ..\it1-ireth\1-rojo\* .
npm test
```

```powershell
git add .
git commit -m "test(TEC-01): pruebas de los criterios de aceptacion"
git push -u origin feature/tec-01-sistema-visual
```

En GitHub → Actions el CI queda en rojo: captúralo también.

## 2. Verde: el código

Cópialo, **léelo** y comprueba que todo pasa.

```powershell
Copy-Item -Recurse -Force ..\it1-ireth\2-verde\* .
npm test
```

```powershell
git add web
git commit -m "feat(TEC-01): agrega la pantalla de sistema visual y componentes"
```

## Integrar

```powershell
npm run lint
npm run build
git push -u origin feature/tec-01-sistema-visual
```

Abre el PR hacia `develop`, completa la plantilla con tus capturas, pide la revisión de **Ivan**, espera el **CI en verde** y haz **Merge**. Mueve la tarjeta a "Hecho" y avisa.

Para ver tu pantalla: `npm run dev` y abre http://localhost:5173 (Ctrl + C para detener).

**Debes poder explicar en la sustentación:**
- Los colores y tamaños son variables en `:root`.
- `Campo` une cada etiqueta con su control: accesibilidad.

## Si algo falla

| Problema | Solución |
|---|---|
| `npm` bloqueado por "scripts deshabilitados" | Usa `npm.cmd` en lugar de `npm` |
| `npm ci` se corta por la red | Repítelo |
| Git entra con otra cuenta | `git remote -v` debe mostrar `TU_USUARIO@github.com` |
| Commit con otro nombre y **sin subir** | `git config user.email "TU_CORREO"` y `git commit --amend --reset-author --no-edit` |
| `git push` rechazado | `git pull --rebase` y otra vez `git push` |
| Conflicto en el PR | `git fetch`, `git merge origin/develop`, corrige, `git add .`, `git commit`, `git push`. Captúralo |
| Avisos LF / CRLF o "SQLite is experimental" | Son normales |
