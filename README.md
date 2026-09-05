# Khom

Harness propietario de entrega para **Codex**: definir un objetivo, acordar un contrato, implementar cambios acotados y conservar evidencia de lo que se verificó.

**Proveedor remoto elegido: Vercel Sandbox.** Podés usar la skill en una sesión de Codex con el entorno de esa sesión. Para ejecución independiente de la laptop, el destino será Vercel Sandbox.

> **Versión 0.1 — base funcional de desarrollo.** Incluye skill/plugin, routing de modelos, API local, estado durable, context compiler y verificación Playwright con evidencia. El dispatcher de Vercel Sandbox y las integraciones automáticas de GitHub/Vercel todavía no están implementados. Un run creado por API queda en cola; no inicia un worker.

## 1. Descargar y comprobar

Requisitos: Git y Node.js **24 o posterior**. Para trabajar con la skill, necesitás Codex. El adapter CLI se inspeccionó con Codex `0.153.2`; su ejecución remota aún requiere validación.

```sh
git clone https://github.com/lucasmontegu/khom.git
cd khom
npm ci
npm test
npm run check
```

`npm ci` instala la versión fijada de Playwright del lockfile. Las pruebas de núcleo incluyen un servidor HTTP temporal; los tests con navegador real se ejecutan por separado con `npm run test:browser`, después de instalar Chromium.

## 2. Usarlo dentro de Codex

### Probar sin instalación global

Abrí este repositorio como proyecto en Codex y enviá:

```text
Leé skills/khom/SKILL.md y aplicá sus instrucciones.
Khom plan: [describí el cambio que querés hacer].
Trabajaremos dentro de esta sesión de Codex.
```

Esto carga las instrucciones desde el archivo; no registra un plugin en el catálogo. Para usarlo en otro proyecto, adjuntá el `SKILL.md` de este repositorio o indicá su ruta absoluta, junto con la ubicación de Khom para resolver ejemplos y documentos.

Ejemplos de trabajo:

| Pedido | Resultado esperado |
| --- | --- |
| `Khom plan: agregar un filtro por estado` | Contrato con aceptación, límites y plan; sin implementar |
| `Khom quick: cambiar el texto del botón a Guardar, en esta sesión` | Cambio pequeño y verificación proporcional usando Codex |
| `Implementá este contrato aprobado en esta sesión` | Trabajo autorizado con las herramientas de Codex y evidencia local |
| `Khom status: <run-id>` | Estado persistido de un run de la API, si está configurada |
| `Khom stop: <run-id>` | Solicitud de detener ese run; informa cancelación pendiente |
| `Khom debrief` | Análisis de receipts existentes, sin inventar métricas |

Son pedidos conversacionales, **no comandos slash nativos ni una CLI `khom`**. El trabajo dentro de la sesión no crea automáticamente un run en la API. Guardá su contrato y resumen de evidencia en `.khom/` del proyecto trabajado. La API es una superficie de desarrollo separada por ahora.

### Instalar el plugin personal en Codex (opcional)

El repo contiene `.codex-plugin/plugin.json`. La instalación personal usa la skill oficial `plugin-creator`, Python y PyYAML. Estos comandos asumen que esa skill está en `~/.codex/skills/.system/plugin-creator`; ajustá la ruta si tu instalación difiere.

Desde el checkout de Khom, **para una primera instalación**, ejecutá el bloque en una shell. Crea una copia de distribución en `~/plugins/khom` y registra el marketplace personal. Se detiene si ya existe esa copia, para evitar pisarla.

```sh
(
  set -eu
  KHOM_CREATOR="$HOME/.codex/skills/.system/plugin-creator"
  test -f "$KHOM_CREATOR/scripts/create_basic_plugin.py"
  test ! -e "$HOME/plugins/khom"
  if test -f "$HOME/.agents/plugins/marketplace.json"; then
    python3 "$KHOM_CREATOR/scripts/read_marketplace_name.py"
  fi
  python3 "$KHOM_CREATOR/scripts/create_basic_plugin.py" khom --with-marketplace
  # Reemplazar el scaffold por los archivos versionados de Khom.
  git archive --output=/tmp/khom-plugin-install.tar HEAD
  tar -xf /tmp/khom-plugin-install.tar -C "$HOME/plugins/khom"
  python3 "$KHOM_CREATOR/scripts/validate_plugin.py" "$HOME/plugins/khom"
  KHOM_MARKETPLACE=$(python3 "$KHOM_CREATOR/scripts/read_marketplace_name.py")
  codex plugin add "khom@$KHOM_MARKETPLACE"
)
```

Abrí una **tarea nueva** en Codex y seleccioná Khom entre los plugins disponibles. El marketplace personal se descubre automáticamente; no requiere `codex plugin marketplace add`. Si falta PyYAML, instalalo en tu entorno Python antes de ejecutar el bloque. Si el plugin ya existe, usá el flujo de actualización de `plugin-creator` con cachebuster y reinstalación; no vuelvas a ejecutar la instalación inicial ni edites el marketplace a mano.

## 3. Levantar el panel y la API local

Desde el repositorio:

```sh
export KHOM_API_TOKEN="$(openssl rand -hex 32)"
npm start
```

Abrí [http://127.0.0.1:4317](http://127.0.0.1:4317) e ingresá ese token. Conservá el token en tu gestor de secretos si necesitás reutilizarlo. El servidor requiere al menos 32 caracteres y escucha en localhost por defecto.

| Variable | Uso |
| --- | --- |
| `KHOM_API_TOKEN` | Token obligatorio del servidor y clientes |
| `PORT` | Puerto del servidor; default `4317` |
| `HOST` | Interfaz de escucha; default `127.0.0.1` |
| `KHOM_API_URL` | Dirección que indicás a Codex como cliente; no configura el servidor |

No se cargan archivos `.env` automáticamente. Para usar uno, podés ejecutar `node --env-file=.env src/server.js` en lugar de `npm start`. No guardes secretos en Git.

El estado se guarda en `.khom-runtime/state.sqlite`. El panel permite consultar runs y pedir stop; los contratos se crean y aprueban por API. Esta API sirve a un único propietario. Para exponerla remotamente faltan el despliegue seguro y almacenamiento apropiado; no desplegar SQLite en Vercel Functions.

## 4. Probar el ciclo de control

En otra terminal, exportá **el mismo** `KHOM_API_TOKEN` del servidor. Prepará una copia del contrato de ejemplo con el repo y SHA reales:

```sh
mkdir -p .khom-runtime
node --input-type=module -e '
import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
const c = JSON.parse(readFileSync("examples/change.json", "utf8"));
c.repo = "lucasmontegu/khom";
c.baseSha = execFileSync("git", ["rev-parse", "HEAD"], {encoding:"utf8"}).trim();
writeFileSync(".khom-runtime/change.json", JSON.stringify(c, null, 2));
'
```

Editá `.khom-runtime/change.json` para describir un cambio real: objetivo, criterios observables, invariantes, permisos y presupuesto. El ejemplo de botón es ilustrativo; este repositorio no tiene ese formulario. Para una entrega, conservá también `.khom/changes/<id>/change.md` en el proyecto destino.

Registrar el contrato y, después de revisarlo, aprobar su revisión:

```sh
curl --fail-with-body http://127.0.0.1:4317/api/changes \
  -H "Authorization: Bearer $KHOM_API_TOKEN" \
  -H 'Content-Type: application/json' --data-binary @.khom-runtime/change.json

# Ajustar button-label y revision si cambiaste el ejemplo.
curl --fail-with-body http://127.0.0.1:4317/api/changes/button-label/approve \
  -H "Authorization: Bearer $KHOM_API_TOKEN" \
  -H 'Content-Type: application/json' -d '{"revision":1}'

curl --fail-with-body http://127.0.0.1:4317/api/changes/button-label/run \
  -H "Authorization: Bearer $KHOM_API_TOKEN" \
  -H 'Content-Type: application/json' \
  -H 'Idempotency-Key: button-label-first-run' -d '{}'
```

Copiá el `id` del run devuelto. **El estado esperado es `queued`**, porque el dispatcher está pendiente. Podés comprobar stop y receipt sin iniciar un worker:

```sh
export KHOM_RUN_ID='reemplazar-por-el-id-devuelto'
curl --fail-with-body "http://127.0.0.1:4317/api/runs/$KHOM_RUN_ID" \
  -H "Authorization: Bearer $KHOM_API_TOKEN"
curl --fail-with-body -X POST "http://127.0.0.1:4317/api/runs/$KHOM_RUN_ID/stop" \
  -H "Authorization: Bearer $KHOM_API_TOKEN"
curl --fail-with-body "http://127.0.0.1:4317/api/runs/$KHOM_RUN_ID/receipt" \
  -H "Authorization: Bearer $KHOM_API_TOKEN"
```

Al detener un run en cola, queda `cancelled` con receipt. Para continuar, crear un run nuevo sobre el mismo cambio enviando `{"parent":"<run-id-anterior>"}` y otra `Idempotency-Key`. Reutilizar la misma key solo sirve para reintentar **la misma solicitud** sin duplicarla. Si actualizás un contrato, incrementá su revisión y aprobala nuevamente.

## 5. Ejecución remota: Vercel Sandbox

**Vercel Sandbox es la elección por defecto para el worker remoto**, registrada en [las decisiones de arquitectura](docs/VERCEL_SANDBOX.md). No hace falta elegir ni administrar un VPS para esa ruta.

El flujo previsto es: plugin Codex → controlador durable → Vercel Sandbox con Codex → pruebas y revisión → draft PR y evidencia. El trabajo de control debe continuar fuera de Desktop; usar un sandbox por sí solo no completa esa integración.

Todavía no hay comando `khom deploy`, SDK de Sandbox conectado ni credenciales Vercel requeridas para probar esta versión local. La [guía de integración](docs/VERCEL_SANDBOX.md) detalla lo que falta y la documentación oficial. El sandbox alojará ejecución; el estado de contratos, autorizaciones y receipts deberá persistir fuera del workspace descartable.

## 6. Elegir modelos por tarea

La política inicial busca reducir llamadas costosas sin debilitar la aceptación:

| Tarea | Riesgo bajo/normal | Riesgo alto |
| --- | --- | --- |
| Implementar o reparar | Luna | Sol |
| Clarificar, planificar, diagnosticar o revisar | Sol | Astra |
| Resumir | Luna | Sol |
| Ejecutar tests, navegador, checks o estado | Sin modelo | Sin modelo |

`examples/change.json` incluye:

```json
"risk": "standard",
"modelPolicy": { "version": 1, "maxTier": "astra", "effort": "medium" }
```

`risk` admite `low`, `standard`, `high`. `maxTier` admite `luna`, `sol`, `astra`; `effort` admite `low`, `medium`, `high`. La selección no baja de modelo para encajar en el techo: pide aprobación si necesita superarlo. Cambiar la política requiere una revisión nueva del contrato. Los contratos antiguos sin política explícita deben revisarse antes del siguiente intento.

Comprobar la selección, **sin ejecutar ni consumir un modelo**:

```sh
npm run model:route -- examples/change.json implement
npm run model:route -- examples/change.json plan
npm run model:route -- examples/change.json review
npm run model:route -- examples/change.json implement 1
npm run model:route -- examples/change.json browser
```

Un fallo de implementación reparable eleva Luna a Sol; dos, a Astra, siempre dentro del techo y los límites de intentos/estancamiento. La selección por sí sola no autoriza ni agenda un reintento. El controller calcula fallos desde el historial persistido. Cada intento conserva modelo solicitado, esfuerzo, motivo y hash de política; el consumo se guarda cuando el proveedor lo reporta. El costo monetario sigue como `unavailable`.

El adapter `executeCodex` usa `--model` y `model_reasoning_effort` explícitos. Una revisión abre contexto efímero y sandbox `read-only`. El helper acepta `availableModels` para bloquear modelos ausentes; la validación de disponibilidad en la cuenta remota corresponde al provisioning. **La skill no cambia automáticamente el modelo de esta conversación.** Ver [integración del adapter y receipts](docs/MODELS_AND_BROWSER.md).

## 7. Verificar UI con Playwright

Instalar Chromium y correr los tests reales (desde la raíz de Khom):

```sh
export PLAYWRIGHT_BROWSERS_PATH="$PWD/.khom-runtime/browsers"
npm run browser:install
npm run test:browser
```

Con `npm start` en otra terminal, preparar un snapshot local con el SHA de tu checkout:

```sh
mkdir -p .khom-runtime
node --input-type=module -e '
import { writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
writeFileSync(".khom-runtime/browser-snapshot.json", JSON.stringify({
  repo: "lucasmontegu/khom",
  sha: execFileSync("git", ["rev-parse", "HEAD"], {encoding:"utf8"}).trim(),
  url: "http://127.0.0.1:4317"
}, null, 2));
'
npm run verify:browser -- examples/browser-change.json .khom-runtime/browser-snapshot.json --local
```

El comando prueba el panel en escritorio y móvil. Devuelve `status`, `scope` y la ruta del reporte; sale con código `1` si falla. Los JSON y capturas quedan en `.khom-runtime/browser/<id>/`. La evidencia local **no puede aprobar una entrega remota**. El SHA local es una referencia declarada por quien corre el comando, no una verificación externa del contenido servido.

Para una preview real de Vercel, preparar un snapshot con `repo`, `sha`, `deploymentId` y la `url` inmutable del deployment (solo el origen HTTPS, sin slash final ni alias de branch). Configurar `VERCEL_TOKEN` y, si corresponde, `VERCEL_TEAM_ID` en el entorno. Ejecutar sin `--local`:

```sh
npm run verify:browser -- contrato-aprobado.json snapshot-preview.json
```

El collector consulta Vercel antes y después, exige procedencia GitHub y rechaza producción, SHA/repo distintos o deployment no listo. El gate exige todas las combinaciones de escenario/viewport del contrato, con screenshots y hash del escenario. La integración externa necesita probarse con tu proyecto; las pruebas automatizadas usan fixtures locales y respuestas Vercel simuladas.

Los escenarios admiten `click`, `fill`, `press`, `expectVisible`, `expectText`, `expectValue`, con selectores Playwright. Deben incluir al menos una assertion. Se bloquean otros orígenes y redirects iniciales; las previews protegidas sin acceso autorizado fallan. Usar datos de prueba, nunca secretos en el contrato. Las capturas prueban lo observado; no aprueban por sí solas calidad visual o accesibilidad.

## Desarrollo y límites

- `src/core.js`: contratos, aprobación por hash, context compiler, gates, leases y receipts.
- `src/codex.js`: adapter de `codex exec`; no lo invoca automáticamente la API.
- `src/server.js` y `src/web.html`: control local autenticado y panel.
- `skills/khom/SKILL.md`: instrucciones del plugin.
- [PRD](docs/PRD.md) y [cobertura de implementación](docs/IMPLEMENTATION.md).

`Store.complete` y `Store.reconcile` son interfaces internas de confianza. Antes de utilizarlas con workers reales, conectar collectors independientes y reconfirmación externa de HEAD, checks y cancelación. La validación estructural no prueba por sí sola que GitHub o Vercel aprobaron algo.

Pendientes: dispatcher remoto, recuperación externa, autenticación Codex en Sandbox, PR/checks automáticos, judge real, aislamiento por cliente y notificaciones. El collector de preview y Playwright ya existen; falta conectarlos al dispatcher remoto. El target de entrega es **ready_to_merge**; merge y producción son acciones separadas.

Código propietario; no se concede una licencia de redistribución.
