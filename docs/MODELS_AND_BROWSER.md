# Integración de modelos y verificación

## Contrato y autorización

Al guardar un contrato, Khom materializa `risk` y `modelPolicy`. Su hash forma parte de la aprobación, del run y del context pack. Los defaults corresponden a la versión 1 de política: Sol para decisiones habituales, Luna para cambios acotados y Astra para alto riesgo o escalación. No son una tabla de precios ni una garantía de ahorro.

Cambiar un modelo/techo/esfuerzo requiere nueva revisión de contrato. El router es determinista, no usa un modelo para elegir otro. El default de un worker implementador activo se mantiene.

## Adapter CLI

Uso interno en un worker autorizado (el API server todavía no lo despacha):

```js
import { executeCodex } from './src/codex.js';

const result = await executeCodex({
  cwd: workspacePath,
  prompt: contextPack.prompt,
  task: 'implement',
  risk: approvedContract.risk,
  policy: approvedContract.modelPolicy,
  failedAttempts: recordedFailures,
  availableModels: modelsVerifiedOnWorker,
  timeoutMs: remainingBudgetMs,
  signal: cancellationSignal,
});
```

Las variables del ejemplo provienen del controlador: no aceptar que el implementador las elija. `result.execution` describe el modelo solicitado, no una afirmación independiente de qué modelo ejecutó el proveedor. `usage` recoge contadores JSONL si existen; `cost` permanece `unavailable`. Los logs completos pueden contener datos privados y no se exponen automáticamente en el panel.

El controller llama `store.claim(runId, owner, now, task)` antes de despachar. La intención persistida contiene la ruta elegida. Debe pasar al adapter la misma revisión, tarea y contador de fallos, y comparar `result.execution` con la intención. `store.complete(..., { ..., usage: result.usage })` conserva consumo en el receipt. El cierre requiere evidencia independiente, no la salida autodeclarada de Codex. La conexión automática entre estas piezas sigue pendiente del dispatcher.

`availableModels` es la lista comprobada durante provisioning. Si falta el modelo seleccionado se bloquea; no hay sustitución silenciosa. El adapter no descubre por sí solo disponibilidad/precios ni cambia el modelo raíz de Codex Desktop.

## Browser verification

Playwright se ejecuta como herramienta y recibe el plan autorizado: criterios, escenarios, pasos y viewports. El contrato no contiene JavaScript arbitrario; admite una lista acotada de operaciones de navegador. El verificador genera un contexto de navegador nuevo por escenario.

En modo deployment, el inspector consulta la API de Vercel antes y después del navegador. La evidencia contiene SHA, revisión, deployment ID, URL inmutable, escenario/hash, viewport, timestamps y archivos de reporte/captura. Cada escenario vinculado a un criterio es obligatorio en el gate. Una falla no desaparece porque otro viewport pasó.

El collector actual reconoce deployments con metadata GitHub (`githubCommitSha`, `githubCommitOrg`, `githubCommitRepo`). No inventa procedencia si falta. Las previews protegidas y dependencias de otro origen no están habilitadas automáticamente. Adaptar explícitamente políticas de acceso antes de esos casos.

`verifyBrowser` permite `trace: true` desde código para diagnóstico con fixtures sin secretos. Los traces están desactivados por defecto porque pueden capturar contenido sensible. Las capturas enmascaran inputs de tipo password, pero no garantizan redacción de otros datos privados. La retención/purga del almacenamiento remoto continúa pendiente.

El verificador local permite solo localhost y devuelve `scope: local`. Sirve para desarrollo y tests; el gate de ready exige `scope: deployment`. La vista de localhost no queda autenticada por conocer un SHA.

Quedan fuera de estas assertions declarativas las evaluaciones visuales subjetivas y una auditoría completa de accesibilidad. No reducir esos criterios a una captura o a la existencia de un elemento.

## Fuentes e inspiración

- [Orquestador Astra/Luna de donvito](https://github.com/donvito/codex-astra-luna-orchestrator): referencia conceptual para separar decisiones de ejecución acotada. No se copió su código ni sus instrucciones.
- CLI instalado `codex exec --help` (0.153.2): opciones `--model`, `-c`, `--sandbox`, `--ephemeral` y JSONL.
- [Playwright Library](https://playwright.dev/docs/library) y [assertions](https://playwright.dev/docs/test-assertions): navegador programático y assertions con espera.
- [Vercel SDK: deployments](https://github.com/vercel/sdk/blob/main/docs/sdks/deployments/README.md): referencia del collector de preview.

Medir consumo y reintentos por entrega aceptada antes de afirmar una mejora de costos. La ejecución de modelos reales y el piloto de Vercel Sandbox todavía necesitan validación remota.
