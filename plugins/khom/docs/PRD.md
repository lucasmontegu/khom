# Khom — Proprietary Delivery Harness

**Versión:** 1.0
**Fecha:** 5 de septiembre de 2026
**Estado:** PRD propuesto para implementación; no representa un sistema ya construido.
**Owner inicial:** Lucas
**Orientación:** Codex-first · cloud-first · ejecución loop-first · GitHub → Vercel
**Uso inicial:** sistema interno de entrega para proyectos reales de clientes.

> **Actualización de implementación:** el proveedor remoto por defecto elegido por Lucas es Vercel Sandbox. La experiencia inicial también permite trabajo explícito dentro de la sesión de Codex. La ejecución autónoma cloud y su controlador durable siguen pendientes de validación. Ver [decisión de runtime](VERCEL_SANDBOX.md).

## 1. Resumen ejecutivo

Khom convierte una intención de producto en un cambio verificable y entregable. Lucas define el problema, las restricciones y las decisiones importantes; Khom prepara contexto, selecciona capacidades, ejecuta acciones acotadas, verifica resultados y repara fallas hasta alcanzar el contrato o una condición explícita de parada.

El activo propietario es la forma de entregar: criterio de producto, calidad, selección de contexto, estrategias de implementación, evaluación y aprendizaje entre proyectos. Comercialmente se vende el resultado que este sistema permite producir. La cantidad de agentes y las tecnologías internas no son la propuesta de valor al cliente.

Codex será el motor inicial. El trabajo deberá continuar en la nube aunque la laptop esté apagada. Codex Desktop será una superficie cómoda de planning y supervisión; una interfaz web mínima permitirá iniciar, aprobar, observar y detener trabajo desde otros dispositivos. El destino inicial de las aplicaciones será GitHub y Vercel.

El MVP tendrá un worker de implementación activo por cambio, un judge independiente cuando corresponda, un PR por entrega y un loop durable. El diseño contempla worktrees, councils y otros proveedores, pero su expansión dependerá de problemas observados en proyectos reales.

## 2. Problema y oportunidad

Hoy Lucas obtiene buenos resultados con Codex, pero debe coordinar manualmente skills, contexto, reparaciones, revisión y entrega. Los workkhoms exhaustivos agregan ceremonia a cambios pequeños; los chats largos acumulan supuestos y ruido; paralelizar sin límites introduce conflictos y trabajo de integración.

Khom debe reducir cinco costos concretos:

1. Decidir y recordar qué skill invocar en cada situación.
2. Volver a explicar el contexto al cambiar de conversación o worker.
3. Supervisar cada test fallido y cada reparación rutinaria.
4. Reconstruir qué se hizo, qué se verificó y por qué se detuvo.
5. Depender de una computadora personal para mantener la ejecución.

**Hipótesis de producto:** un contexto acotado, un contrato verificable y una ejecución con feedback pueden reducir el tiempo humano por entrega sin empeorar la calidad. Esta hipótesis se medirá; no se presupone una mejora por usar más agentes.

## 3. Usuario y trabajos principales

Usuario primario: Lucas como product engineer que construye para distintos clientes. Usuario secundario futuro: un colaborador técnico dentro del mismo proceso. No se diseña inicialmente un SaaS público multiusuario.

| Trabajo | Resultado esperado |
|---|---|
| Pensar una feature | Contrato claro, decisiones explícitas y alcance ejecutable |
| Cambiar algo pequeño | Resolución rápida con verificación proporcional |
| Delegar una implementación | Continuidad sin supervisar cada paso |
| Mejorar una pantalla | Iteraciones sobre una preview real y una rúbrica acordada |
| Revisar desde el teléfono | Ver resultado, evidencia y decisiones pendientes |
| Retomar tras una interrupción | Recuperar estado sin reenviar toda la conversación |
| Aprender de entregas | Detectar fricción y ajustar una política con evidencia |

## 4. Decisiones de producto consolidadas

| ID | Decisión | Consecuencia |
|---|---|---|
| D01 | Harness propietario de entrega | Optimizar trabajo real antes de productizar |
| D02 | Codex-first | Una integración de ejecución funcional antes de sumar motores |
| D03 | Cloud-first | Ningún proceso esencial depende de Desktop encendido |
| D04 | Planning humano en trabajo significativo | Lucas conserva decisiones de producto y tradeoffs importantes |
| D05 | Intención estable, plan mutable | Se pueden revisar tareas por evidencia dentro del alcance autorizado |
| D06 | Modos direct, guided y loop | El proceso crece con incertidumbre, riesgo y necesidad de feedback |
| D07 | Ejecución loop-first | SDD, TDD, debugging y review son estrategias, no fases obligatorias |
| D08 | Routing por capability | Matt/Addy son presets combinables, no personalidades excluyentes |
| D09 | Contexto compilado | Workers nuevos no heredan por defecto el chat de planning |
| D10 | Evidencia sobre declaraciones | Un worker no puede declarar aprobada su propia entrega |
| D11 | Paralelismo económico | Un worker es una decisión válida y el default del MVP |
| D12 | GitHub → Vercel | Branch, PR, checks y preview forman la unidad de entrega |
| D13 | Receipts desde el MVP | Toda ejecución deja un resultado auditable |
| D14 | Judgement independiente | Council solo cuando el costo del error lo justifica |
| D15 | Abstracciones pequeñas | Interfaces propias sin framework universal de proveedores |
| D16 | App Server como integración profunda | Validar soporte; no confundirlo con una API de Codex Cloud |

**Resolución de tensiones:** el deseo de empezar como plugin se conserva como experiencia de entrada. La exigencia posterior de trabajar desde cualquier lugar obliga a alojar el estado y el controlador fuera del plugin. La preferencia por Vercel se aplica a la aplicación y al control plane; el worker necesita un entorno apto para su duración y procesos.

## 5. Objetivos y no objetivos

### Objetivos del MVP

- Completar una entrega desde planning aprobado hasta PR listo para merge.
- Ejecutar y verificar remotamente sin depender de la laptop.
- Usar una vía rápida para cambios triviales.
- Reparar fallas acotadas sin pedir aprobación por cada intento.
- Mantener pequeños los contextos mediante artefactos recuperables.
- Exponer el motivo de cada parada y la acción necesaria para continuar.
- Producir evidencia de código y, cuando corresponda, de producto renderizado.

### Fuera del MVP

- Marketplace de skills o catálogo genérico de loops.
- Facturación SaaS, onboarding público o administración empresarial completa.
- Bots persistentes por especialidad, guardians o councils permanentes.
- Memoria vectorial, routing aprendido o autooptimización de políticas.
- Scheduler complejo, PRs encadenados, merge queue propia o Kubernetes.
- Compatibilidad simultánea con múltiples motores y clouds.
- Publicación autónoma general a producción.
- Reemplazar el loop interno, la compacción o las herramientas de Codex.

## 6. Experiencia y modos de trabajo

Los comandos siguientes expresan la UX propuesta de Khom. No son comandos existentes de Codex ni requieren construir una CLI independiente.

```text
@khom <objetivo>            Clasifica y elige el modo adecuado
@khom plan <objetivo>       Colabora en planning sin iniciar implementación
@khom run <change-id>       Ejecuta el contrato autorizado
@khom quick <objetivo>      Solicita la vía direct
@khom status <change-id>    Muestra progreso, evidencia y bloqueos
@khom stop <run-id>         Detiene nuevos pasos y solicita cancelar el activo
@khom resume <run-id>       Reconcilia estado y continúa si está autorizado
@khom debrief              Analiza receipts terminados
```

### 6.1 Direct

Para alcance pequeño, intención clara y verificación barata: corregir copy, padding o un botón. Secuencia: inspeccionar → editar → verificar → receipt breve. No requiere PRD, DAG, council ni un controlador de reintentos autónomos. Sí conserva trazabilidad mínima.

La nube sigue siendo el default. Un contexto remoto disponible puede evitar setup repetido. La ejecución local es una excepción configurable para tareas direct; nunca un requisito ni un fallback silencioso. Si el cambio revela complejidad, Khom conserva el avance y propone o aplica una escalación dentro de la autorización existente.

### 6.2 Guided

Para una feature acotada o un repositorio poco conocido. Lucas participa en la definición y autoriza un plan o una porción de trabajo. Khom ejecuta esa porción con verificación; devuelve el resultado al checkpoint acordado. No agenda nuevas rondas autónomas indefinidas ante una falla material.

### 6.3 Loop

Para trabajo que requiere convergencia: feature con pruebas, bug reproducible, mejora de UI con feedback. Tras la autorización, el controlador persiste y repite acciones acotadas hasta satisfacer el contrato o detenerse. Implementación, diagnóstico, tests y reparación pueden alternarse. La revisión costosa se reserva para candidatos suficientemente verificados.

| Señal | Modo inicial | Intervención |
|---|---|---|
| Copy o estilo puntual con resultado inequívoco | direct | Instrucción inicial suele alcanzar |
| Feature pequeña siguiendo un patrón existente | guided | Contrato breve; sin preguntas redundantes |
| Mejorar jerarquía visual de una pantalla | loop | Acordar objetivo, referencia y criterio de salida |
| Bug con reproducción y test | loop | Autorizar reparación dentro del alcance |
| RBAC, pagos o migración importante | guided → loop | Cerrar decisiones y límites antes de ejecutar |

La clasificación considera alcance, incertidumbre, riesgo, reversibilidad y calidad del feedback disponible. El usuario puede elegir otro modo, pero el cambio de modo no amplía por sí solo permisos, presupuesto o alcance.

### 6.4 Superficies

- **Plugin Codex:** entrada conversacional con skills y herramientas hacia Khom.
- **Web responsive:** lista de cambios, contrato, acción pendiente, timeline resumido, preview, evidencia y controles de ejecución.
- **GitHub:** revisión del diff, checks y merge; no duplicar su interfaz completa.

La primera pantalla debe responder: qué se intenta lograr, qué está ocurriendo, qué falta y si Lucas necesita intervenir. Los logs completos quedan accesibles bajo demanda. Notificar finalización, bloqueo, presupuesto agotado o decisión requerida; no cada test o polling sin cambios.

## 7. Planning y contrato ejecutable

El planning inspecciona el repositorio, identifica supuestos, consulta las capabilities necesarias y produce un contrato. Para trabajo significativo, la aprobación humana es explícita y queda vinculada a una revisión del contrato. La instrucción directa puede autorizar un cambio trivial dentro de la política existente.

El contrato contiene:

- Problema, resultado deseado y fuera de alcance.
- Repositorio, base de trabajo y target de entrega.
- Criterios de aceptación observables con IDs estables.
- Invariantes y decisiones de producto.
- Estrategia mínima de verificación y evidencia necesaria.
- Acciones permitidas, límites y condiciones de escalación.
- Presupuestos de ejecución y condición de parada.
- Plan inicial de slices, cuando resulte útil.

El artefacto será progresivo: un patch puede ocupar diez líneas; una feature necesita decisiones y aceptación; un epic puede incorporar arquitectura y riesgos. Se usará `change.md` como documento principal, con una sección de plan. Un documento separado solo se justifica si mejora la comprensión.

### 7.1 Ejemplo conceptual

```yaml
schema_version: 1
change_id: organization-invites
revision: 3
goal: Permitir invitaciones a una organización
mode: loop
delivery_target: ready_to_merge
acceptance:
  - id: AC1
    condition: Solo un administrador puede invitar
    evidence: integration-test
  - id: AC2
    condition: La invitación expira a los siete días
    evidence: targeted-test
  - id: AC3
    condition: Aceptar dos veces no duplica membresías
    evidence: integration-test
invariants:
  - No cambiar el modelo de roles existente
allowed:
  - Modificar la branch del cambio
  - Crear y actualizar un draft PR
  - Ejecutar pruebas y generar previews
requires_decision:
  - Cambiar quién puede pertenecer a una organización
  - Ejecutar una migración destructiva en producción
budgets:
  max_attempts_per_slice: 3
  max_run_minutes: 60
  max_review_rounds: 2
```

Los valores son defaults propuestos para el piloto, no límites de Codex.

### 7.2 Adaptación del plan

Khom puede reagrupar tareas, reutilizar un componente existente, cambiar el orden o agregar una reparación técnica que preserve intención e invariantes. Registra evidencia, plan anterior y delta.

Debe pedir una decisión si cambia comportamiento de producto, contrato público, permisos, presupuesto autorizado o riesgo material. No puede reescribir criterios de aceptación para convertir una falla en éxito. Una revisión material invalida la aprobación anterior para el alcance modificado; el trabajo independiente que sigue autorizado puede continuar.

## 8. Motor de ejecución loop-first

```mermaid
khomchart TD
  A[Contrato autorizado] --> B[Observar estado real]
  B --> C[Elegir acción acotada]
  C --> D[Compilar contexto]
  D --> E[Ejecutar worker o herramienta]
  E --> F[Recolectar evidencia]
  F --> G[Verificar y registrar]
  G --> H{Resultado}
  H -->|Hay progreso y presupuesto| B
  H -->|Candidato verificado| I[Judgement cuando corresponde]
  I -->|Hallazgo material reparable| B
  I -->|Aceptación satisfecha| J[PR listo y receipt]
  H -->|Decisión, bloqueo o límite| K[Parada explícita y receipt]
```

Observe consulta branch, commit, intentos, checks, deployment y evidencia vigente. Choose selecciona la acción útil de menor costo razonable. Puede usar un modelo para diagnóstico o decisiones ambiguas; bookkeeping, dependencias, contadores y transiciones pertenecen al código.

Cada acción debe especificar qué espera mejorar y cómo verificarlo. Un nuevo intento solo se justifica por una hipótesis distinta, evidencia nueva o una falla transitoria acotada. Más texto, más commits o una autoevaluación optimista no constituyen progreso.

### 8.1 Estados

Separar el estado del cambio del estado de una ejecución evita confundir una interrupción con la cancelación del objetivo.

| Estado del run | Significado |
|---|---|
| queued | Esperando capacidad |
| running | Acción en curso |
| waiting_external | Esperando CI, preview o proveedor, con deadline |
| succeeded | Satisface el target declarado |
| no_op | El objetivo ya estaba satisfecho y existe evidencia |
| needs_decision | Falta una decisión de producto o alcance |
| approval_required | Falta permiso para una acción concreta |
| blocked | Falta una dependencia externa identificada |
| exhausted | Presupuesto consumido |
| stagnated | Intentos sin avance significativo |
| failed | Error terminal de ejecución o infraestructura |
| cancelled | Cancelación confirmada o cierre con acciones residuales documentadas |

Los últimos nueve son estados terminales del run. Continuar crea un run sucesor enlazado al anterior y conserva su receipt. El cambio puede seguir abierto. `cancelling` puede usarse como estado transitorio hasta confirmar el resultado del proveedor.

### 8.2 Presupuestos iniciales

Defaults configurables: tres intentos por slice, dos rondas de review, un worker implementador activo, sesenta minutos por run y dos iteraciones sin progreso antes de detenerse. Los tiempos de espera externos tienen límites propios y también cuentan en el tiempo total.

Reservar parte del presupuesto para verificación y cierre. Si el proveedor no entrega consumo monetario o tokens fiables, mostrar `unavailable` o una estimación identificada; no afirmar un límite monetario exacto. Mantener límites operativos medibles de tiempo, intentos y concurrencia.

## 9. Skills y capability routing

Khom selecciona capacidades según el problema: clarify, specify, plan, implement, debug, verify, review, ship y debrief. Los presets `matt`, `addy`, `balanced`, `fast`, `rigorous` y un futuro `lucas` cambian preferencias; no imponen un lifecycle rígido.

La inspiración de Matt se toma para preguntas incisivas, requisitos y disciplina de desarrollo; Addy aporta cobertura de prácticas a lo largo del trabajo. La comparación publicada por Addy se trata como perspectiva de su autor, no como evaluación neutral de superioridad. [Comparación de enfoques](https://skills.addy.ie/compare/).

| Capability | Política propuesta para balanced |
|---|---|
| Clarificar | Preguntas focalizadas inspiradas en Matt |
| Planificar | Slice vertical y verificación asociada |
| Implementar | Incrementos acotados y convenciones del repo |
| Diagnosticar | Hipótesis y reproducción antes de otro intento |
| Verificar | Herramientas deterministas; skill solo si agrega criterio |
| Revisar | Judge independiente con evidencia y alcance fijo |
| Diseñar el loop | Límites, feedback y parada inspirados en Loopy |

Esta tabla es diseño propio de Khom; no declara nombres de skills ni compatibilidad que no hayan sido comprobados.

### 9.1 Registro mínimo

Cada skill instalada debe tener ID, origen, revisión o hash, capabilities, costo aproximado de contexto, herramientas requeridas, permisos y estado de compatibilidad con Codex. Fijar versiones y preservar atribución/licencia al incorporarlas.

El router resuelve una capability a una skill concreta validada o a una acción nativa. Carga únicamente el contenido necesario, habitualmente una skill por acción. Si falta una skill opcional, usa el fallback configurado y lo registra; si es necesaria para cumplir un gate, bloquea esa acción con motivo explícito.

Resolver conflictos con políticas del proyecto y autorización del usuario. Ninguna skill puede ampliar permisos. Las actualizaciones de packs no cambian silenciosamente runs en curso. Guardar en el receipt qué revisión se utilizó.

## 10. Context compiler y memoria

El compiler construye el contexto mínimo suficiente para la acción. El worker puede empezar con una conversación nueva porque la continuidad reside en artefactos, Git y estado durable.

Entradas: contrato autorizado, slice, base SHA, decisiones relevantes, instrucciones aplicables del repo, archivos seleccionados, resultados de dependencias, skill resuelta y fallas necesarias para el intento actual.

Salida: `ContextPack` versionado con propósito, acceptance IDs, restricciones, contexto incluido, referencias recuperables, evidencia relevante y manifest de procedencia. Registrar hash de entradas, bytes o tokens estimados y razón de selección.

### 10.1 Reglas de compilación

1. Incluir primero intención, invariantes y aceptación; nunca truncarlas silenciosamente.
2. Seleccionar archivos y decisiones por rutas, imports, cambios y referencias explícitas.
3. Resumir resultados de dependencias con commit y vínculo a la evidencia completa.
4. Incluir solo los errores actuales; conservar el histórico fuera del prompt.
5. Cargar la skill seleccionada y las instrucciones aplicables.
6. Permitir ampliación de contexto mediante una solicitud concreta y registrada.

Meta inicial: 1–8k tokens de contexto compilado en tareas comunes; objetivo operativo de 6k y máximo inicial de 12k. Son hipótesis medibles. No incluyen necesariamente contexto interno, razonamiento o lecturas posteriores del proveedor.

Si falta contexto esencial, dividir el trabajo o ampliar el presupuesto autorizado. No sacrificar corrección para mejorar una métrica de tokens. La caché se invalida al cambiar contrato, SHA, instrucciones o skill relevante.

### 10.2 Memoria durable

MVP: decisiones versionadas, contexto de producto, convenciones del repo, receipts y Git. Sin embeddings.

Cada descubrimiento distingue observación, hipótesis y decisión aceptada. Una conclusión del worker no se convierte automáticamente en política permanente. Las decisiones de producto se promueven con intervención humana; hechos técnicos pueden registrarse con evidencia y ámbito.

La memoria de un cliente no entra en el contexto de otro. Patrones reutilizables deben extraerse sin información privada. Los judges reciben decisiones vigentes, pero no la conversación persuasiva del maker.

## 11. Workers, aislamiento y worktrees

Un worker es una ejecución descartable con objetivo acotado, contexto, permisos, presupuesto y workspace. Su salida es un `Attempt`: candidato, bloqueado o fallido, junto a archivos, commit y evidencia declarada. El runtime valida esa evidencia y decide el estado real.

Default MVP: un workspace remoto y una branch por cambio. Los worktrees son una técnica de aislamiento cuando el sustrato la permite; no se presupone que Codex Cloud exponga control de worktrees. Un clone o entorno aislado puede cumplir el mismo contrato.

En una etapa posterior, paralelizar únicamente slices independientes con beneficio esperado. Schema, tipos, servicio y endpoint fuertemente acoplados pueden formar una sola slice vertical. No convertir cada ítem de checklist en un agente.

### Política de integración futura

- Un único escritor por branch de integración.
- Cada worker declara base SHA y ámbito de escritura; observar overlap reduce concurrencia.
- Dependencias aprobadas producen commits identificables.
- Integrar candidatos serialmente y repetir verificación relevante sobre el resultado combinado.
- Resolver conflictos en un intento acotado; nunca sobreescribir cambios externos para hacer pasar el merge.
- Conservar snapshots y evidencia antes de limpiar workspaces; limpieza tras cierre y retención configurada.

Un worktree aísla archivos y cambios Git; no sustituye aislamiento de procesos, secretos, red o datos.

## 12. Verificación, judgement y councils

### 12.1 Verificación determinista

Usar el conjunto mínimo suficiente según riesgo: pruebas dirigidas, tipos, lint relevante, build, integración y smoke checks. Ejecutar checks baratos antes de revisiones costosas. No inventar tests que solo repiten la implementación ni correr toda la suite después de cada edición.

Cada criterio de aceptación debe tener evidencia o una excepción explícita autorizada. Una prueba omitida, un check desconocido o una preview inaccesible no equivalen a PASS. Separar fallas preexistentes de regresiones con una baseline cuando haga falta; no excluirlas silenciosamente.

Evidencia mínima: tipo, productor, estado, fecha, repo, SHA, revisión de contrato, configuración o comando, resultado y referencia al artefacto. Para UI: deployment ID, URL exacta, viewport, escenario y capturas. Los eventos del proveedor se validan contra el estado externo antes de cerrar un gate.

### 12.2 Judgement

Un judge es un evaluador con contexto nuevo y permisos de lectura. Recibe objetivo, aceptación, diff o plan, decisiones relevantes y evidencia. Devuelve verdict, hallazgos, severidad, fundamento, acción sugerida y límites de lo evaluado.

Default: omitir para cambios direct triviales; un judge al final de una feature; revisión del plan si tiene supuestos de riesgo. El reviewer no es el metrónomo del loop: después de una reparación, volver a verificar lo afectado y revisar los hallazgos materiales pendientes.

La separación entre capacidades de ejecución y responsabilidad humana, con evidencia como frontera, está inspirada en el enfoque de Addy. [Loop engineering](https://skills.addy.ie/loops/).

### 12.3 Council

Un council reúne temporalmente dos o tres perspectivas independientes cuando existe riesgo alto, desacuerdo fundamentado, incertidumbre importante o solicitud humana. Ejemplos: permisos, integridad de datos, contratos públicos o un rediseño de UX importante.

Cada judge recibe el mismo paquete base y una pregunta concreta, sin leer primero los veredictos de los demás. Un arbiter reconcilia claims con evidencia. No se aprueba por mayoría de votos ni por un score de confianza autorreportado. Si una objeción material no se puede resolver, corresponde una decisión humana.

MVP: judge Codex con contexto nuevo. Council como ejecución explícita posterior; sin scheduler de debates. Cross-provider, incluido Grok, se habilitará solo tras validar acceso, costo, política de datos y utilidad. La diversidad de modelos es una hipótesis de mejora, no una garantía.

Guardians persistentes quedan fuera del MVP. Si se incorporan, aportarán conocimiento referenciado; su memoria no será un sustituto del judge independiente.

### 12.4 Loop visual

Para “mejorar una pantalla”, acordar antes: problema de uso, referencias, restricciones y rúbrica. Evaluar jerarquía, legibilidad, consistencia, responsive, accesibilidad y éxito del flujo principal.

Capturar baseline; implementar; generar preview; abrir escenarios definidos; registrar capturas; comparar; reparar problemas concretos. Terminar al satisfacer los criterios y resolver hallazgos materiales, o al agotar el presupuesto. “Todavía podría verse mejor” no justifica iteración infinita.

## 13. Arquitectura cloud-first

```mermaid
khomchart TB
  D[Codex Desktop / plugin] --> API[Khom API autenticada]
  W[Web responsive] --> API
  API --> S[(Estado durable y eventos)]
  API --> Q[Despacho durable]
  Q --> L[Controlador del loop]
  L --> C[Context compiler y router]
  C --> E[Execution adapter]
  E --> CC[Codex Cloud si integración validada]
  E --> RW[Worker remoto Codex]
  RW --> AS[App Server vía bridge interno]
  CC --> G[GitHub branch y PR]
  RW --> G
  G --> CI[Checks]
  G --> V[Vercel Preview]
  CI --> L
  V --> J[Browser y judgement]
  J --> L
  L --> S
```

Khom es el outer loop de entrega. Codex conserva su inner loop de herramientas e implementación. No deben existir dos controladores que compitan por reintentar la misma acción: cada lease asigna un dueño del intento y un límite externo.

### 13.1 Componentes y responsabilidad

| Componente | Responsabilidad |
|---|---|
| Plugin/web | Intención, aprobación, estado y revisión |
| API/control plane | Autenticación, comandos y políticas |
| Store durable | Runs, contratos, locks, eventos y relaciones |
| Despacho | Reintentos de transporte, deadlines y recuperación |
| Loop controller | Decidir siguiente acción dentro del contrato |
| Context compiler | Contexto suficiente y trazable |
| Execution adapter | Traducción al proveedor elegido |
| Evidence collector | Checks, logs, artefactos y previews |
| Judgement policy | Cuándo evaluar y cuándo escalar |

Propuesta de stack: TypeScript, web/API en Vercel, Postgres administrado para estado, almacenamiento de objetos para evidencia y un mecanismo durable de despacho. Elegir una implementación concreta de cola/workkhom en el spike inicial. No construir un motor general distribuido.

El proceso de ejecución debe residir en un entorno apto para jobs y herramientas del repo. No mantener el loop vivo mediante una única solicitud HTTP ni estado en memoria de una función. Considerar un sandbox administrado si cumple duración, persistencia y recuperación; usar compute remoto dedicado cuando sea necesario. Esta elección se valida antes del MVP.

### 13.2 Codex Cloud y App Server: hechos y límites

Codex Cloud documenta tareas en entornos aislados, ejecución en background, configuración por repositorio y revisión de resultados/PRs. Es el sustrato preferido si Khom puede controlarlo con una integración soportada. La documentación consultada no establece por sí sola una API pública general que cubra todas las operaciones requeridas por Khom. No asumir endpoints privados. [Codex Cloud](https://learn.chatgpt.com/docs/cloud).

App Server documenta integración de clientes con autenticación, historial, approvals y eventos; incluye `thread/start`, `thread/resume` y protocolo bidireccional. La documentación marca el comando y transporte WebSocket como experimentales/no soportados para producción. No tratarlo como servicio hosted ni como acceso implícito a Codex Cloud. [App Server](https://learn.chatgpt.com/docs/app-server).

**Decisión de implementación propuesta:** aprovechar App Server mediante un bridge alojado junto al worker, preferentemente comunicación interna por stdio y sin exposición pública directa. El bridge encapsula la dependencia experimental; esto reduce superficie de integración, pero no convierte App Server en una garantía de soporte productivo.

Para jobs simples, evaluar SDK o modo no interactivo como ruta de ejecución con menos integración de cliente. La documentación de App Server recomienda SDK para automatización/CI. La selección final es una salida del spike; no se implementan simultáneamente todas las rutas. [App Server](https://learn.chatgpt.com/docs/app-server).

### 13.3 Spike obligatorio de integración

Probar con la cuenta y versión reales: autenticación, iniciar trabajo, recibir estado, recuperar resultado, solicitar reparación, cancelar, sobrevivir reconexión y asociar un commit al resultado. Verificar autorización no interactiva, cuotas y persistencia del entorno.

| Resultado | Decisión |
|---|---|
| Codex Cloud cubre el contrato con interfaces soportadas | Implementar Cloud como primer adapter |
| Cloud requiere intervención manual o interfaces no documentadas | Declarar integración asistida; no venderla como loop autónomo |
| Worker remoto con SDK/CLI cubre el contrato | Usarlo para el loop completo manteniendo Codex y nube |
| App Server aporta controles necesarios | Prototipar bridge, fijar versión y aceptar riesgo explícito antes de uso productivo |
| Ninguna ruta cumple continuidad y recuperación | No declarar terminado el MVP cloud-first |

El éxito del producto depende de “trabajar desde cualquier lugar”; no de que todos los jobs lleven la etiqueta Codex Cloud.

## 14. GitHub → Vercel: golden path

Prerequisitos del proyecto: repositorio conectado, permisos de Khom, entorno reproducible, comandos de verificación y proyecto Vercel vinculado. El piloto usa proyectos existentes; su creación automática puede venir después.

1. Fijar contrato, base SHA y branch `khom/<change-id>`.
2. Ejecutar una slice acotada y guardar el candidato.
3. Push y creación/actualización idempotente de un único draft PR.
4. Recolectar CI y deployment para ese commit.
5. Verificar preview cuando la aceptación lo requiere.
6. Reparar sobre la misma entrega dentro del presupuesto.
7. Ejecutar judgement final según política.
8. Marcar listo para merge con evidencia vigente.
9. Lucas revisa y autoriza merge; observar deployment de producción y smoke si están dentro del alcance.

Vercel documenta deployments asociados a pushes, URLs de preview para PRs y eventos para disparar verificaciones tras desplegar. Khom aprovechará esa integración en lugar de reconstruirla. [Vercel para GitHub](https://vercel.com/docs/git/vercel-for-github).

### Invariantes de entrega

- La evidencia debe corresponder al SHA actual del PR y a la revisión autorizada.
- Una URL de branch mutable no identifica por sí sola el deployment evaluado.
- Un nuevo push invalida la aprobación de código anterior y exige evaluar impacto y revalidar.
- Eventos tardíos de deployments previos no pueden aprobar el commit nuevo.
- El gate final vuelve a consultar HEAD y checks antes de marcar ready.
- El merge debe respetar protecciones del repositorio y revalidar si cambia la base.
- `ready_to_merge`, `merged` y `deployed` son hitos distintos. El target inicial es el primero.

Preview con autenticación o protección requiere un mecanismo autorizado de acceso para el verificador. Si no está disponible, el criterio visual queda pendiente. Pruebas con datos usan fixtures o cuentas de prueba, sin efectos externos de producción.

Migraciones destructivas y rollback de datos requieren una estrategia específica. Revertir un deployment no implica revertir la base de datos. El primer MVP entrega el PR y evidencia; no promete resolver automáticamente cualquier incidente de producción.

## 15. Estado, persistencia y recuperación

GitHub es fuente de verdad de commits, branches, PRs y checks. Vercel es fuente de deployments. Khom conserva contratos, permisos, presupuestos, intentos, relaciones y decisiones. Reconcilia estos dominios; no mantiene copias que puedan aprobarse mutuamente sin comprobar estado externo.

Artefactos propuestos en el repo:

```text
.khom/
  config.yaml
  product.md
  quality.yaml
  skills.lock.json
  decisions/
  changes/<change-id>/change.md
```

El DAG estructurado se agrega cuando aporta valor. Runs, receipts completos, logs y capturas viven en el store remoto y se exportan a demanda; no se commitea cada evento. Un `state.json` local, si existe, es caché, nunca coordinador cloud.

### Modelo mínimo de datos

| Entidad | Campos esenciales |
|---|---|
| Project | cliente, repo, entorno, runtime target, política |
| Change | goal, revisión, target, aceptación, autorización, branch/PR |
| Run | change, estado, presupuesto, padre, inicio y cierre |
| Slice | objetivo, dependencias, scope, estado verificado |
| Attempt | run/slice, provider ID, base/result SHA, salida y errores |
| Evidence | criterio, resultado, SHA, deployment, origen, referencia |
| Judgement | scope, revisión, verdict, hallazgos y evidencia |
| Decision | pregunta, respuesta, autor, alcance y revisión |
| Receipt | snapshot del run, referencias, resultado y motivo de parada |

### Recuperación operativa

Usar idempotency keys para comandos y efectos externos. Guardar intención antes de despachar; ante respuesta incierta, consultar el proveedor antes de duplicar un job o PR. Deduplicar webhooks y registrar versión del estado.

Un lease con expiración y fencing token evita que un worker viejo publique tras ser reemplazado. El control plane confirma autoridad vigente antes de aceptar resultados o publicar cambios. Al expirar un lease, reconciliar el job remoto y los commits; no asumir que murió.

Cerrar el navegador o Desktop no cancela el run. Reiniciar el controlador recupera estado durable y concilia operaciones pendientes. Si el proveedor no permite retomar un contexto, iniciar otro intento desde el último commit seguro y contexto recompilado. No prometer que una conversación de App Server reaparece en otro host solo por conocer su ID.

`stop` detiene nuevos despachos, solicita cancelación y documenta cualquier acción ya completada. No borra branches ni revierte automáticamente trabajo. Si una cancelación no se puede confirmar, mostrar esa incertidumbre y bloquear nuevos efectos del worker obsoleto.

## 16. Receipts y debrief

Cada run, incluido direct, termina con receipt durable. El documento humano es breve; el JSON permite auditoría y métricas. Debe poder entenderse sin leer el chat original.

Contenido: objetivo y revisión, alcance autorizado, modo, proveedor y versión, skills, context manifests, intentos, decisiones, commits, PR, deployments, evidencia por aceptación, hallazgos pendientes, presupuesto utilizado/disponibilidad, estado terminal y motivo de parada. Incluir la siguiente acción si no terminó con éxito.

```json
{
  "schemaVersion": 1,
  "runId": "run-example",
  "changeId": "organization-invites",
  "contractRevision": 3,
  "deliveryTarget": "ready_to_merge",
  "terminalState": "succeeded",
  "stopReason": "All required acceptance evidence is current",
  "attemptIds": ["attempt-1", "attempt-2"],
  "evidenceIds": ["evidence-tests", "evidence-review"],
  "usage": {"tokens": null, "cost": null, "availability": "unavailable"},
  "outstandingIssues": []
}
```

Ejemplo ilustrativo abreviado; el schema implementado exigirá referencias de commit y PR para el golden path.

Loopy inspira las acciones acotadas, límites, aceptación y receipts, además del debrief que diferencia problemas del loop de fallas del entorno. Khom adopta estas ideas como diseño propio de ingeniería; no necesita incorporar Loopy como dependencia inicial. [Loopy](https://github.com/Forward-Future/loopy).

El debrief analiza runs comparables y propone la mejora mínima: un check faltante, un contexto omitido o un exceso de paralelismo. Un run aislado no demuestra un patrón. Mostrar tamaño de muestra, mezcla de tareas y limitaciones; no atribuir causalidad automáticamente a una skill. Los cambios de políticas se revisan y versionan, no se autoaplican desde una reflexión del modelo.

## 17. Abstracciones multi-provider sin sobreconstruir

Tres contratos pequeños propios: ejecución, deployment y judgement. No imponer todos los métodos a todos los proveedores; consultar capabilities y hacer explícitas las limitaciones.

```ts
interface ExecutionProvider {
  capabilities(): ExecutionCapabilities;
  start(input: ExecutionRequest): Promise<RunHandle>;
  inspect(handle: RunHandle): Promise<ExecutionSnapshot>;
  result(handle: RunHandle): Promise<AttemptResult>;
  cancel(handle: RunHandle): Promise<CancelResult>;
}

interface RuntimeTarget {
  resolvePreview(commit: string): Promise<PreviewSnapshot>;
  inspectDeployment(id: string): Promise<DeploymentSnapshot>;
}

interface JudgementProvider {
  evaluate(input: JudgementPack): Promise<JudgementResult>;
}
```

Son contratos conceptuales, no SDKs existentes. Continuar, streaming o rollback son capacidades opcionales que se agregan al necesitarlas. Un repair puede ser una nueva tarea compilada si el proveedor no soporta continuidad.

Primero implementar un motor, GitHub y Vercel. Extraer una abstracción adicional cuando aparezca un segundo uso real. La futura migración a contenedores cambia provisioning, deployment y evidencia del runtime; no debe cambiar intención, aceptación, receipts ni reglas del loop.

## 18. Permisos y requisitos no funcionales

El onboarding fija autorizaciones por proyecto: lectura, escritura en branches de Khom, draft PR, checks y previews. Merge, publicación y operaciones de producción tienen permisos separados. Una autorización puede persistir; no se vuelve a preguntar por cada reparación dentro de ese alcance.

Controles mínimos necesarios para operar repositorios de clientes:

- Identidad autenticada para iniciar, aprobar, consultar y detener.
- Credenciales por proyecto con alcance mínimo y revocación comprobable.
- Secretos fuera de Git, prompts, capturas y receipts; redacción de logs.
- Separación de workspaces, almacenamiento y datos entre clientes.
- Verificación de origen de eventos y autorización del actor.
- Contenido del repo, issues y páginas tratado como datos no confiables frente a la política de ejecución.
- Judges sin credenciales de escritura; workers sin permisos de producción por defecto.
- Retención configurable: propuesta de 30 días para logs/capturas del piloto y receipts hasta cierre del proyecto, sujeto a política del cliente.

Metas de experiencia del piloto: acuse de comando en menos de cinco segundos y eventos reflejados en menos de treinta segundos en condiciones normales. Son objetivos a medir, no SLA. La cola y la duración del proveedor se muestran aparte.

## 19. Requisitos funcionales y aceptación del MVP

| ID | Requisito | Prueba de aceptación |
|---|---|---|
| F01 | Intake adaptativo | Botón puntual va a direct; UI abierta exige criterio de feedback |
| F02 | Planning humano | `plan` produce contrato y no inicia implementación |
| F03 | Autorización versionada | Cambio material requiere nueva decisión; reparación acotada no |
| F04 | Routing | Resuelve skill fijada sin cargar todos los packs |
| F05 | Context compiler | Worker nuevo ejecuta sin transcript original y con procedencia |
| F06 | Loop acotado | Una falla reproducible dispara reparación y reverificación |
| F07 | Paradas | Límite o estancamiento termina con motivo y receipt |
| F08 | Continuidad remota | Run continúa con laptop apagada y se consulta desde otro dispositivo |
| F09 | Recuperación | Reinicio del controlador no duplica job, push ni PR |
| F10 | Golden path | Un cambio produce branch, draft PR, checks y preview asociada |
| F11 | Evidencia vigente | Evento tardío de un SHA anterior nunca aprueba HEAD nuevo |
| F12 | Judgement | Judge nuevo recibe evidencia y puede bloquear por hallazgo material |
| F13 | Aislamiento | Un proyecto no puede consultar contexto o secretos de otro |
| F14 | Cancelación | Stop impide nuevos pasos y expone estado real del intento activo |
| F15 | Receipt | Éxito, bloqueo y cancelación dejan exportación JSON y resumen |
| F16 | Hitos honestos | Ready para merge nunca se presenta como desplegado |

F08 y F09 son condiciones de salida obligatorias del MVP, no mejoras futuras. El paralelismo de múltiples implementadores no lo es.

## 20. MVP y roadmap

El orden es vinculante; los plazos se estimarán después del spike. Evitar un calendario ficticio antes de conocer integración y entorno.

### Etapa 0 — Validar el sustrato

Entregables: matriz de capacidades probadas, decisión de provider, autenticación, entorno reproducible y una tarea remota con resultado verificable. Probar reconexión y cancelación. Elegir estado durable y despacho. **Salida:** camino automatizable demostrado sin depender de la laptop.

### Etapa 1 — Corte vertical mínimo

Un repo, un usuario, un worker, contrato, context compiler básico, routing a unas pocas skills fijadas, implementación → test → repair, draft PR y receipt. Plugin delgado más vista web mínima para run/stop/status y decisiones. **Salida:** una feature real llega a ready para merge con laptop apagada y recuperación comprobada.

### Etapa 2 — MVP de entrega completo

Cerrar direct/guided/loop, política de aprobación, preview vinculada a SHA, browser verification para UI, fresh judgement, límites, notificaciones accionables y exportación. **Salida:** F01–F16 satisfechos en pruebas de integración y un piloto real.

### Etapa 3 — Aprendizaje operativo

Debrief manual sobre receipts, métricas de tiempo humano, ajuste de contexto, mejora de provisioning y reutilización segura por cliente. **Entrada:** volumen suficiente de runs comparables para identificar fricción recurrente.

### Etapa 4 — Paralelismo selectivo y councils

Scheduler por dependencias, worktrees/clones, integración serial y councils temporales. **Entrada:** evidencia de que tareas independientes esperan capacidad o de que un judge omite riesgos relevantes. Comparar contra un solo worker incluyendo costo de integración.

### Etapa 5 — Portabilidad por demanda

Segundo proveedor de judgement o ejecución; segundo runtime de deployment; eventual entrega en contenedores. **Entrada:** necesidad de cliente o ventaja medida. Guardians, memoria semántica y producto multiusuario requieren una decisión independiente.

### Backlog inicial ejecutable

1. Spike de integración y prueba de independencia de laptop.
2. Schemas de Change/Run/Attempt/Evidence/Receipt y state machine.
3. Autenticación y configuración de un proyecto piloto.
4. Context compiler y registry mínimo con versiones fijadas.
5. Adapter de ejecución y recuperación idempotente.
6. Loop secuencial con presupuestos y parada.
7. GitHub PR/checks y correlación de preview.
8. Judge, browser verification y gate de aceptación.
9. Plugin, web responsive y notificaciones accionables.
10. Piloto medido, debrief y correcciones antes de expandir alcance.

Cada ítem se implementa con una demostración funcional; no se requiere terminar una infraestructura genérica antes de probar el corte vertical.

## 21. Métricas y evaluación

Métrica principal: **minutos humanos activos por entrega aceptada**, incluyendo planning, interrupciones, revisión e integración. Medir por tipo de tarea y comparar con la práctica previa de Lucas.

| Métrica | Interpretación |
|---|---|
| Tiempo humano/entrega | Ahorro real para el negocio |
| Lead time a ready | Velocidad completa, incluida espera y reparación |
| Rework tras ready | Calidad del gate de salida |
| Regresiones tras merge | Calidad del resultado; registrar ventana de observación |
| Interrupciones evitables | Autonomía útil sin esconder decisiones necesarias |
| Intentos y costo/entrega | Economía del loop |
| Contexto inicial y total | Efectividad del compiler sin omitir lecturas posteriores |
| Proporción de trabajo cloud | Cumplimiento de independencia de laptop |
| Fallas de integración | Costo real del paralelismo |
| Cobertura de aceptación | Criterios con evidencia vigente, excepciones visibles |

Piloto propuesto: al menos diez cambios reales, incluyendo direct, bug, feature y UI. Registrar baseline de tareas comparables. Meta inicial orientativa: reducir 25% el tiempo humano sin aumentar rework/regresiones; si no hay suficiente muestra, informar incertidumbre. No prometer resultados estadísticos con diez casos.

Objetivos duros del piloto: cero aprobaciones basadas en SHA obsoleto, cero efectos externos duplicados en pruebas de recuperación y receipts en todos los estados terminales. Investigar cualquier incumplimiento antes de aumentar autonomía.

## 22. Riesgos, mitigaciones y decisiones pendientes

| Riesgo | Respuesta |
|---|---|
| Codex Cloud no expone el control necesario | Spike temprano; worker remoto como opción explícita |
| Dependencia experimental de App Server | Bridge acotado, versión fijada y alternativa evaluada |
| El harness consume más tiempo que ahorra | Piloto real y medición de tiempo humano |
| Tests verdes con producto incorrecto | Acceptance mapping, preview y judgement |
| Review circular | Hallazgos materiales, límites y re-review dirigido |
| Contexto insuficiente | Ampliación justificada y referencias recuperables |
| Councils correlacionados | Argumentos independientes y evidencia; sin voto mayoritario |
| Conflictos multi-agent | Serial por defecto; medir integración antes de paralelizar |
| Evento externo duplicado o viejo | Idempotencia, reconciliación y validación por SHA |
| Plan se vuelve rígido | Delta técnico permitido con invariantes estables |
| Plan deriva de alcance | Revisiones y autorización vinculadas al contrato |
| Dependencia de Vercel dificulta un cliente | Contrato de runtime pequeño; migrar por necesidad real |

Pendientes de implementación, con default propuesto:

- **Ruta de ejecución real:** resolver en etapa 0; Cloud preferido si cubre el contrato.
- **Host del worker y despacho:** elegir según pruebas de duración, recuperación y costo.
- **Repo piloto:** uno existente con GitHub, Vercel y pruebas reproducibles.
- **Skills exactas:** comenzar con 4–6 capacidades comprobadas; fijar origen y revisión.
- **Merge/producción:** aprobación humana en MVP.
- **Presupuesto monetario:** fijar al conocer modalidad de consumo; no inventar equivalencias con suscripciones.
- **Nombre Khom:** nombre de trabajo, sin decisión de marca o distribución pública.

Estos pendientes no reabren Codex-first, cloud-first ni el golden path: concretan cómo implementarlos con capacidades comprobadas.

## 23. Definición final de éxito

Lucas puede acordar una feature, autorizar su contrato, cerrar la laptop y volver desde otro dispositivo a un PR con evidencia suficiente para decidir el merge. Si el sistema no llega, puede explicar qué intentó, dónde quedó, qué falta y qué decisión necesita, sin reconstruir la conversación.

Un cambio de botón sigue siendo rápido. Una mejora de UI usa feedback visual real. Una feature obtiene reparación y revisión independientes. Las decisiones de producto siguen bajo responsabilidad humana. La infraestructura crece cuando mejora una entrega real.

## 24. Fuentes y procedencia

Este PRD sintetiza la conversación “Diseñar Orquestador Multiagente”, recuperada en dos páginas de historial. El PRD anterior dentro de ese historial estaba truncado; las decisiones posteriores y los mensajes del usuario sí aportaron el alcance aquí consolidado. Las especificaciones, schemas, defaults y criterios de aceptación de este documento son propuestas de Khom, no prestaciones declaradas por terceros.

Fuentes consultadas el 5 de septiembre de 2026:

- [Codex App Server](https://learn.chatgpt.com/docs/app-server): integración, protocolo y límites de soporte.
- [Codex Cloud](https://learn.chatgpt.com/docs/cloud): entorno de ejecución y superficies de trabajo.
- [Addy — Loop engineering](https://skills.addy.ie/loops/): relación entre autonomía, capacidades y evidencia.
- [Addy — Compare](https://skills.addy.ie/compare/): perspectiva del autor sobre los enfoques de skills.
- [Loopy](https://github.com/Forward-Future/loopy): loops acotados, receipts y debrief.
- [Vercel para GitHub](https://vercel.com/docs/git/vercel-for-github): integración de PRs y deployments.

No se trasladan al PRD cifras promocionales, límites de modelos ni supuestas APIs de la conversación previa que no se hayan verificado. La compatibilidad exacta se valida en el spike y se registra como evidencia del proyecto.
