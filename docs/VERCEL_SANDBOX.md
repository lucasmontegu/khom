# Vercel Sandbox: proveedor remoto por defecto

Estado: **decisión aceptada; adapter y despliegue pendientes**.

## Decisión

Khom usa Codex como motor principal y Vercel Sandbox como entorno remoto por defecto. La primera experiencia funciona dentro de una sesión de Codex. Cuando se solicite ejecución independiente de la laptop, el worker correrá en Vercel Sandbox. No se incorpora otro proveedor ni se exige un VPS.

El sandbox local de permisos de Codex (`workspace-write`, `read-only`) y Vercel Sandbox son capas diferentes: uno limita acciones del agente; el otro aloja el proceso remoto.

## Arquitectura prevista

1. El plugin reúne intención y aprobación del contrato.
2. Un controlador con estado y despacho durables registra el intento antes de crear trabajo remoto.
3. Un adapter inicia o reconcilia Vercel Sandbox, prepara el repo en el SHA autorizado y ejecuta Codex.
4. Verificadores independientes recogen pruebas y estado GitHub/Vercel del candidato.
5. El controlador registra la evidencia, decide reparación o cierre y produce el receipt.

El plugin no necesita un servidor para guiar una sesión existente. La ejecución autónoma remota sí necesita que el controlador sobreviva al cierre de Desktop. No mantener ese controlador en una solicitud HTTP abierta.

## Preparación del primer spike

- Seleccionar un proyecto/equipo Vercel y configurar autenticación de Sandbox.
- Usar el SDK oficial `@vercel/sandbox` y fijar la versión al implementar el adapter.
- Preparar una imagen con una versión fijada de Codex y las herramientas del repo.
- Validar autenticación no interactiva de Codex por separado: acceso a Vercel no autentica a OpenAI.
- Probar inicio, logs, resultado, timeout, cancelación confirmada y recuperación tras desconexión.
- Medir arranque y ejecución; no asumir superioridad de velocidad sin medir este workload.
- Conectar persistencia del control plane fuera del workspace del worker antes del piloto cloud.

Vercel documenta SDK/CLI para ejecutar comandos y gestionar archivos en microVMs, con persistencia entre sesiones. La documentación recomienda OIDC cuando está disponible y admite access tokens para otros entornos. Elegir el mecanismo concreto al conectar el adapter. [Sandbox](https://vercel.com/docs/sandbox), [autenticación](https://vercel.com/docs/sandbox/concepts/authentication).

La persistencia de archivos permite reconstruir un workspace; no garantiza reanudar un proceso Codex o una sesión del modelo. Khom debe reconciliar el intento real antes de repetir efectos. Consultar límites y persistencia vigentes antes del despliegue. [Persistencia](https://vercel.com/docs/sandbox/concepts/persistence).

## Condición de salida

Un cambio real termina en un PR con evidencia del SHA vigente mientras la laptop está apagada. Reiniciar el controlador no duplica jobs, pushes o PRs; stop confirma cancelación o expone incertidumbre. Hasta demostrarlo, la ejecución cloud sigue marcada como pendiente.
