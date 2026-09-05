# Estado de implementación

## Decisión inicial

Khom es Codex-first. El plugin es una superficie de entrada; no mantiene vivo el controlador. No se introducen integraciones para otros motores.

El repositorio de proyecto indicado por Lucas es `https://github.com/lucasmontegu/khom`. Vercel Sandbox es el proveedor remoto elegido por defecto. Falta implementar su adapter y validar el proyecto piloto de entrega (puede ser el propio Khom). Ver `VERCEL_SANDBOX.md`.

## Spike de integración — evidencia local

- `codex --version`: `codex-cli 0.153.2`.
- `codex exec --help`: confirma ejecución no interactiva, JSONL, stdin, sandbox `workspace-write`/`read-only`, `--ephemeral`, `--ignore-user-config` y directorio de trabajo.
- El adapter usa esas opciones comprobadas en el CLI instalado. No se asume una API de Codex Cloud ni se usa App Server experimental.
- No se lanzó un trabajo de modelo de pago ni se probó autenticación remota. Inicio real, reparación, recuperación y cancelación remota siguen pendientes.
- Node local: 26.7.0. Store SQLite mediante `node:sqlite`.

## Cobertura comprobada

11 pruebas automatizadas cubren aprobación versionada, deduplicación, exclusión concurrente, evidencia de SHA obsoleto, rechazo de autoaprobación del maker, review independiente, base del PR, intentos sin progreso, receipts, sucesores, stop, fencing, reinicio durable, deadline, invalidación de contrato durante intento, límite de contexto, hash de skill y autenticación HTTP.

El test HTTP requiere permiso para abrir un puerto efímero de localhost. Se ejecutó fuera de la restricción de red del sandbox tras aprobación automática. No fue omitido.

## Desviaciones deliberadas y pendientes

El PRD propone TypeScript/Postgres. Esta base usa JavaScript ESM sin dependencias y SQLite para probar invariantes localmente. No es la decisión definitiva del control plane cloud. La adaptación a Postgres debe preservar transacciones, índice de exclusión e idempotencia; no usar SQLite sobre un filesystem efímero.

La revisión de contrato es conservadora: toda actualización invalida la aprobación y detiene el resultado activo. Separar deltas técnicos de cambios materiales puede añadirse cuando exista evidencia del piloto.

La política de stop conserva un estado `cancelling` hasta confirmación explícita del proveedor. Un lease vencido no habilita automáticamente otro worker. Falta un reconciliador remoto que consulte el proceso real y compruebe los efectos externos. No se afirma que el store evite por sí solo pushes o PRs duplicados.

La evidencia es validada estructuralmente por el gate; los collectors reales deben obtenerla de fuentes independientes. Falta el cierre final con consulta a HEAD, checks y deployment. El adapter Codex hereda el entorno del host: el provisioning debe separar credenciales y procesos antes de ejecutar repositorios de clientes. El modo read-only es una restricción de filesystem, no aislamiento completo de secretos/red.

## Siguiente corte vertical

1. Implementar el adapter de Vercel Sandbox con autenticación Codex reproducible; ejecutar spike con cancelación y desconexión de Desktop.
2. Crear aislamiento de workspace y secretos por proyecto; fijar versión de Codex en el worker.
3. Conectar un dispatcher secuencial, heartbeat de lease, outbox y reconciliación. Separar errores transitorios, checkpoint guided y reparación loop por hipótesis nueva.
4. Incorporar Postgres administrado y autenticación de control plane web; migraciones y backup.
5. GitHub: branch `khom/<change-id>`, único draft PR, checks y validación del SHA. Vercel: deployment inmutable asociado a ese SHA.
6. Verificación determinista y browser en contexto independiente; judge nuevo sin credenciales de escritura.
7. Gate final y marca ready con reconfirmación externa; receipts exportables y notificaciones accionables.
8. Piloto real con laptop apagada y reinicio del controlador. F08/F09 son obligatorios antes de llamar MVP al sistema.

## Estado F01–F16

- F01/F02: política conversacional y contrato inicial; intake automatizado pendiente.
- F03: aprobación por revisión/hash probada.
- F04/F05: compiler y hash de skill; registry/resolver y selección de instrucciones pendientes.
- F06/F07: transiciones y presupuestos probados; dispatcher/reparación real pendientes.
- F08: pendiente de integración Vercel Sandbox y prueba laptop apagada.
- F09: persistencia y no redispatch de lease incierto probados; reconciliación externa pendiente.
- F10: integración GitHub/Vercel pendiente.
- F11/F12: gates internos probados; collectors y judge real pendientes.
- F13: pendiente de aislamiento por proyecto; API inicial de un propietario.
- F14: stop y rechazo de resultado posterior probados; cancelación del proveedor pendiente.
- F15: receipts JSON para cierres implementados; artefactos y exportación completa pendientes.
- F16: único target `ready_to_merge`; no confundir con deployed.
