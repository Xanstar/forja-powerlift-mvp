# MVP piloto de Forja: roadmap de desarrollo en seis días

**Resultado:** en seis días laborables enfocados, dos desarrolladores deben poder entregar un ciclo de coaching listo para piloto, con historial resistente a cambios del plan, escrituras seguras ante reintentos y un panel del coach que identifique el trabajo que requiere atención.

**Límite:** el piloto demuestra `programar -> ejecutar -> detectar -> revisar -> ajustar`. No demuestra multitenencia empresarial, coaching automatizado, nutrición, chat, facturación ni un rebranding integral de la aplicación.

**Supuesto de capacidad:** dos desarrolladores enfocados durante seis días laborables. Con una sola persona, conservar el mismo orden de dependencias y planificar **9-10 días laborables enfocados**; no comprimir la verificación ni la seguridad de datos para cumplir seis días.

## Punto de partida

1. Fijar el escenario piloto y las reglas de desviación.
2. Incorporar el modelo de instantáneas de ejecución detrás de la interfaz actual.
3. Hacer que la finalización de sesiones sea transaccional e idempotente.
4. Leer el historial y los pendientes del coach desde el nuevo modelo de ejecución.
5. Incorporar la bandeja del coach y luego reducir la fricción del atleta.
6. Ensayar migración, recuperación y el guion de aceptación del piloto.

El objetivo es un **monolito modular**, no una reescritura. Conservar Next.js, Drizzle/libSQL, Auth.js y la estructura actual de rutas. Introducir límites de dominio dentro de la aplicación actual y trasladar el comportamiento de forma incremental.

## Tesis del producto

Forja es un sistema operativo vertical para el coaching de powerlifting. Cierra un ciclo operativo en lugar de presentar herramientas separadas de planificación y seguimiento:

```text
DUEÑO / COACH COMPRADOR
comprende el estado y confía en la operación
                 |
                 v
COACH OPERADOR ---- programa ----> ATLETA
       ^                              |
       |                              |
 revisa + ajusta <--- desviaciones <--+ ejecuta + registra
```

### Tres actores conectados

| Actor | Función en el ciclo | Evidencia del piloto |
|---|---|---|
| Dueño/coach comprador | Comprender el producto y el estado operativo; confiar en el flujo para continuar pagando | Puede ver atletas activos, revisiones pendientes, ejecución reciente y preparación del sistema sin interpretar datos crudos |
| Coach operador | Prescribir, monitorear, revisar y ajustar | Puede publicar un plan, recibir una excepción relevante, inspeccionar ejecución inmutable y realizar un ajuste posterior |
| Atleta | Ejecutar y registrar con fricción mínima | Puede ingresar, completar una sesión, reintentar tras un fallo de red y comprender qué se guardó |

No optimizar un actor perjudicando a otro. Un editor más rápido que corrompe el historial o un panel más completo que aumenta la fricción de registro rompe el ciclo del producto.

## Mapa de capacidades actuales

| Área | Funcionamiento actual | Evidencia / rutas probables | Implicación para el piloto |
|---|---|---|---|
| Acceso del coach | Entorno autenticado y autorización de recursos | `src/lib/auth.ts`, `src/lib/server-authorization.ts`, `src/app/(coach)/` | Conservar; ampliar pruebas de autorización para nuevos recursos |
| Resumen del coach | Conteos agregados y atletas recientes | `src/app/(coach)/dashboard/page.tsx` | Sustituir conteos ambiguos por una bandeja accionable |
| Gestión de atletas | Perfiles, marcas, pruebas de fuerza e historial | `src/app/(coach)/atletas/`, `src/app/(coach)/marcas/`, `src/lib/actions/athletes.ts`, `src/lib/actions/records.ts` | Conservar flujos; leer historial desde instantáneas |
| Planificación | Programa -> semana -> día -> ejercicio -> serie planificada | `src/db/schema.ts`, `src/lib/actions/planning.ts`, rutas de planificación | Mantener jerarquía; agregar estado de ciclo de vida y transiciones seguras |
| Ejecución del atleta | Entrenamiento diario, registro de series y finalización | `src/app/(athlete)/hoy/page.tsx`, `src/components/workout-view.tsx` | Acceso canónico protegido por cookie versionada; escribir mediante el agregado de sesión |
| Progreso | Historial de cargas y puntuación de fuerza | `src/app/(athlete)/progreso/page.tsx`, ruta de historial del coach | Leer rendimientos inmutables, no uniones con planes mutables |
| Intercambio de datos | Importación/exportación de atletas y marcas con Excel | `src/app/api/import/atletas/route.ts`, `src/app/api/export/atletas/route.ts` | Conservar; agregar evidencia de validación y transacción |
| Activación | Invitación por WhatsApp, OTP, token aleatorio rotable y acceso verificado | `src/lib/actions/athlete-onboarding.ts`, `src/lib/athlete-access-token.ts` | Implementado localmente; desplegar `0007` y retirar el PIN por cohorte |
| Sin conexión | Cola parcial del cliente para registrar series | `src/lib/offline-queue.ts`, `src/components/workout-view.tsx` | Agregar claves de operación estables y estado visible de sincronización |
| Pruebas | Cobertura unitaria de autorización, onboarding y Evolution; E2E limitado | `tests/*.test.ts`, `tests/e2e/*.spec.ts` | Agregar cobertura de dominio y recorridos críticos antes del piloto |

## Objetivo del MVP

Al finalizar este recorte, un coach debe poder asignar un programa a un atleta; el atleta debe completar una sesión en condiciones normales y con reintentos de red; el coach debe ver y revisar desviaciones relevantes; y el rendimiento registrado debe permanecer intacto tras cambios posteriores del plan.

### Fuera de alcance

- Organizaciones empresariales, aislamiento de tenants, SSO o administración granular del personal.
- Planes generados por IA o decisiones automáticas de coaching.
- Chat, nutrición, marketplace, facturación o superficies públicas de marketing.
- Ontología generalizada de ejercicios o gestión federativa de competencias.
- Sincronización completa offline-first para todos los flujos.
- Rediseño visual integral o sistema de marca definitivo.
- Sustitución del stack actual o separación en servicios.

## Límite del alcance

### Debe: bloqueante del piloto

- [ ] Incorporar `workout_sessions` y `set_performances` como registros inmutables de ejecución.
- [ ] Capturar nombre del ejercicio, prescripción, carga resuelta y referencias de plan/versión al ejecutar.
- [ ] Agregar estados explícitos del programa y transiciones protegidas.
- [ ] Hacer transaccionales las operaciones de inicio, guardado y finalización cuando corresponda, y seguras ante reintentos. El cierre del día ya es atómico e idempotente; el ciclo general de sesión sigue pendiente.
- [ ] Agregar restricciones de unicidad, claves foráneas, enum/check y valores obligatorios para el nuevo recorrido.
- [ ] Definir una semántica canónica de programado, pendiente y completado para atleta y coach.
- [ ] Crear una bandeja del coach con: vencido o ausente, completado con desviación y atención de activación/sincronización.
- [ ] Resolver `%RM` a una carga concreta desde un registro identificado y guardar fuente y carga resuelta.
- [ ] Preservar la finalización con conectividad intermitente y estados visibles en cola, sincronizado y fallido.
- [x] Proveer cierre de sesión del atleta y una política explícita y configurable para el PIN heredado.
- [ ] Incorporar evidencia unitaria, de integración y E2E crítica, ensayo de migración, procedimiento de backup/restauración y checklist de smoke test en producción.

### Debería: solo cuando todo lo obligatorio esté en verde

- [ ] Duplicar semana, día o ejercicio para reducir planificación repetitiva.
- [ ] Agregar confirmación de revisión del coach y una nota breve de ajuste.
- [ ] Mostrar estado del sistema al dueño/coach: atletas activos, sesiones por revisar, sincronizaciones fallidas y última actividad correcta.
- [ ] Agregar edición masiva o eficiente con teclado sin rediseñar el modelo de planificación.
- [ ] Agregar un mecanismo pequeño de feedback del piloto fuera de la transacción crítica de escritura.

### Después: explícitamente fuera del piloto

- Multitenencia empresarial y administración entre gimnasios.
- Permisos complejos, matrices de asignación y exportaciones de auditoría.
- Marketplace o biblioteca amplia de plantillas.
- Mensajería/chatbot y cambios automáticos del plan.
- Nutrición, pagos, suscripciones o analítica comercial.
- Recomendaciones predictivas, modelos avanzados de fatiga y funciones de IA.
- Rebranding final de la aplicación.

## Dirección de arquitectura

### Límites del monolito modular

```text
Rutas Next.js / server actions
             |
             v
+----------------------+   +----------------------+
| Módulo planificación |   | Módulo ejecución     |
| ciclo del programa   |-->| instantáneas sesión  |
| publicación/versión  |   | rendimiento series   |
+----------------------+   +----------+-----------+
                                      |
                           +----------v-----------+
                           | Módulo revisión      |
                           | desvíos + bandeja    |
                           +----------+-----------+
                                      |
+----------------------+   +----------v-----------+
| Identidad/activación |   | Reportes/progreso   |
| coach + atleta       |   | lectura instantánea |
+----------------------+   +----------------------+
             \                    /
              +-- Drizzle/libSQL-+
```

Los límites son carpetas y funciones de servicio dentro de la aplicación, no unidades de despliegue. Las rutas de interfaz deben invocar operaciones acotadas de aplicación, no ensamblar directamente escrituras entre dominios.

### Modelo objetivo de ejecución

```text
program (draft | published | archived)
  -> program_version / identidad de publicación
      -> día / ejercicio / serie planificados
          |
          | iniciar sesión: copiar valores relevantes para ejecutar
          v
workout_session (scheduled | in_progress | completed | reviewed)
  -> set_performance
       plan_set_id?             trazabilidad; nullable para resiliencia
       exercise_name_snapshot   visualización histórica
       prescribed_*_snapshot    pedido del coach
       rm_record_id?             fuente de carga porcentual
       resolved_load_kg?         prescripción concreta al ejecutar
       actual_*                  ejecución real del atleta
       deviation_flags          entrada determinista para revisión
```

### Reglas de datos

| Regla | Comportamiento requerido |
|---|---|
| Independencia histórica | Editar o eliminar un plan futuro no altera la sesión completada ni sus métricas |
| Ciclo del programa | Solo `draft` es libremente mutable; publicar y archivar son transiciones explícitas |
| Identidad de sesión | Una ocurrencia programada de atleta/día tiene como máximo una sesión activa o completada |
| Identidad de rendimiento | Una sesión e instantánea de serie aceptan como máximo una operación de rendimiento |
| Idempotencia | Los reintentos usan una clave estable; el servidor devuelve el resultado ya aceptado |
| Límite transaccional | Rendimientos, finalización y evento de bandeja se confirman juntos |
| Resolución de `%RM` | Se guardan identidad y valor del registro, porcentaje, redondeo y kilogramos resueltos |
| Autorización | Cada escritura demuestra en servidor la propiedad del coach o el acceso atleta-sesión |
| Eliminación | El historial publicado/completado se archiva o desacopla; nunca se borra en cascada |

### Estados y transiciones del programa

```text
draft --publish--> published --archive--> archived
  ^                    |
  |                    +-- create revision --> draft (new version)
  +-- edit freely
```

Para el piloto, el versionado puede ser mínimo: basta una identidad estable de publicación más instantáneas. No construir una plataforma general de event sourcing.

## Dirección de UX

### Claridad para dueño y coach

La primera pantalla del coach debe responder: **¿Quién necesita atención, por qué y cuál es la siguiente acción?** Los totales agregados son secundarios. Mostrar vigencia y fallos explícitamente; nunca presentar un cero que pueda significar “ninguno”, “no programado” o “consulta fallida”.

### Bandeja del coach

Usar un orden de prioridad determinista:

1. Fallo de integridad de datos o sincronización.
2. Sesión completada con desviación material.
3. Sesión programada vencida o ausente.
4. Activación de atleta que requiere acción.
5. Sesión rutinaria completada pendiente de confirmación.

Cada elemento requiere atleta, motivo, sesión/fecha relevante, estado y una acción principal. La bandeja es una proyección consultable del estado del dominio, no una segunda verdad mantenida manualmente.

### Fricción del atleta

- Mantener evidente la siguiente sesión y conservar el recorrido mobile-first actual.
- No pedir dos veces valores ya prescritos o ingresados.
- Mostrar cola local, sincronización correcta y fallo de reintento en lenguaje claro.
- La finalización debe ser deliberada, recuperable e idempotente.
- El cierre de sesión debe ser accesible sin conocer ni volver a ingresar un PIN.

### Línea de trabajo de marca

Documentar el sistema actual y orientar las superficies operativas de alto valor con evidencia del producto. Este resumen técnico utiliza una estética exclusiva de la presentación: grafito forjado, tiza/blanco cálido, acento óxido moderado, divisores de acero y tipografía funcional.

**Esta dirección visual del deck no es la marca final de la aplicación.** Antes de un rediseño integral, realizar un taller independiente de dirección con el usuario, establecer autoridad visual y documentar el universo aprobado. No inferir aprobación a partir del deck ni de la implementación actual.

## Plan paralelo de seis días

| Día | Desarrollador A | Desarrollador B | Dependencia | Resultado demostrable | Evidencia de pruebas | Límite de reversión |
|---|---|---|---|---|---|---|
| 1: Contrato | Definir escenario; diseñar sesión/rendimiento, restricciones, ciclo y claves; escribir migración y fixture | Definir calendario canónico, reglas de desviación, contrato de bandeja y fixtures; mapear lecturas/escrituras | Límite confirmado y esquema actual | Revisión del dominio con un atleta y un programa | Migración en DB descartable; restricciones; fixture | Migración aditiva; recorridos actuales sin cambios |
| 2: Escritura segura | Implementar servicio iniciar/guardar/completar con transacción e idempotencia | Adaptar registro del atleta y payload offline a IDs estables; mostrar estado de cola | Esquema y contrato del día 1 | Registro de sesión; envío duplicado devuelve un resultado | Integración; duplicados, reintentos y fallo parcial | Feature flag o adaptador vuelve al recorrido anterior |
| 3: Lecturas inmutables | Migrar historial/progreso a instantáneas; verificar que editar el plan no altera historial | Implementar resolución `%RM`, fuente, redondeo y estado ausente/obsoleto | Sesión completada del día 2 | Editar plan y mostrar historial y prescripción intactos | Inmutabilidad; matriz `%RM`; autorización | La proyección puede volver atrás preservando datos aditivos |
| 4: Ciclo accionable | Construir proyección de bandeja y lista accionable | Alinear calendario, siguiente sesión, pendientes, vencidos y completados | Estados y desvíos estables | Revisar una desviación real desde el panel | Consultas de bandeja; límites de fecha/zona; ruta enfocada | Conservar panel anterior tras adaptador pequeño |
| 5: Fricción y robustez | Agregar confirmación/nota; duplicación solo si lo obligatorio está verde | Agregar logout, política de PIN, recuperación de sync y robustecer importación | Ciclo principal en verde | Recorrido normal y con reintento más confirmación del coach | E2E feliz, reintento, logout, acceso no autorizado e importación fallida | Aislar mejoras; quitar opcionales antes de tocar escrituras |
| 6: Evidencia de lanzamiento | Ensayar migración, backup/restauración, observabilidad, checklist y runbook | Smoke móvil/multinavegador, accesibilidad, E2E y paquete de aceptación | Todo lo obligatorio integrado y desplegable | Ensayo cronometrado de publicación a ajuste y recuperación | Suite, build, migración, restauración y smoke | Decisión lanzar/no lanzar; rollback y backup ensayados |

### Alternativa con un desarrollador

Usar **9-10 días** en el mismo orden: días 1-3 modelo y escritura; 4-5 lecturas inmutables y `%RM`; 6-7 bandeja/calendario y robustez del atleta; 8-9 verificación; día 10 contingencia. Quitar primero todo lo opcional. Nunca superponer a las apuradas diseño de esquema, escritura y ensayo de migración.

## Unidades de trabajo y módulos probables

| Unidad | Rutas principales | Notas |
|---|---|---|
| Esquema de ejecución | `src/db/schema.ts`, migraciones | Primero aditivo; proteger historial de cascadas |
| Ciclo del programa | `src/lib/actions/planning.ts`, rutas/componentes | Llevar transiciones a servicios de aplicación |
| Servicio de comandos de sesión | Módulo enfocado en `src/lib/` o `src/lib/actions/` | Posee transacción, autorización, idempotencia y desvíos |
| Adaptador de ejecución | `src/app/(athlete)/hoy/page.tsx`, `src/components/workout-view.tsx` | Mantener la interfaz estable al cambiar persistencia |
| Sincronización offline | `src/lib/offline-queue.ts` | IDs estables, reintentos acotados y estado visible |
| Resolución `%RM` | Servicio de planificación/ejecución y consultas de marcas | Guardar fuente y kilogramos resueltos |
| Proyección de historial | Rutas de historial y progreso | Leer instantáneas; preservar datos antiguos durante transición |
| Bandeja del coach | `src/app/(coach)/dashboard/page.tsx`, módulo de consulta | Una proyección canónica y prioridad estable |
| Refuerzo de identidad | Módulos de acceso/logout/activación | Interruptor explícito de PIN y política de migración |
| Seguridad de importación | Rutas API de importación/exportación | Validar primero; aplicar en transacción; preservar compatibilidad |
| Verificación | `tests/`, configuración E2E y CI | Mantener pruebas junto a la unidad que demuestran |

Estas rutas son objetivos de planificación, no permiso para mezclar refactors no relacionados. Inspeccionar los recorridos de llamadas antes de cada implementación.

## Checklist de seguridad, datos y operaciones

### Seguridad

- [x] Verificación de propiedad en servidor para cada operación de coach y sesión de atleta.
- [x] Identidad estable de sesión; logout invalida el estado local de acceso.
- [x] Vencimiento, intentos, reenvíos y errores genéricos de OTP siguen cubiertos.
- [x] El PIN heredado tiene política explícita por entorno y plan de retirada.
- [x] Sin secretos, códigos, PIN ni payloads sensibles en logs o exportaciones.
- [x] El limitador persistente usa cookie cliente aleatoria y fingerprints HMAC; el lockout sobrevive al rollover y el límite por credencial persiste aunque se borre la cookie.
- [ ] Las importaciones exigen autenticación, límites de archivo/tipo/tamaño y validación por fila.

### Integridad de datos

- [ ] Claves foráneas habilitadas y probadas contra el comportamiento real de libSQL.
- [x] Restricciones únicas preservan la finalización por día y evitan reutilizar operaciones entre series y días.
- [ ] Límites numéricos rechazan repeticiones, cargas, RPE y porcentajes imposibles.
- [x] Escrituras de finalización del día atómicas y seguras ante reintentos.
- [ ] El historial sobrevive a edición, archivo y eliminación permitida del plan.
- [ ] Migración aditiva ensayada con datos representativos y ruta documentada de rollback/restauración.

### Operaciones

- [ ] CI ejecuta typecheck/lint, pruebas unitarias/de integración, build y E2E críticos.
- [ ] El smoke test de producción usa fixtures no sensibles.
- [ ] Logs estructurados identifican ID de operación, actor, sesión, resultado y código seguro de error.
- [ ] Alerta o control diario para sincronizaciones fallidas y fallos de entrega de activación.
- [ ] Vigencia del backup y restauración verificadas antes de incorporar atletas.
- [ ] El runbook nombra responsable, disparador de rollback y canal de comunicación.

## Evidencia de aceptación

| Capacidad | Criterio de aceptación | Evidencia requerida |
|---|---|---|
| Publicar | El coach publica un programa válido; las transiciones inválidas fallan de forma segura | Pruebas de estado y recorrido grabado |
| Ejecutar | El atleta inicia y completa la sesión asignada en móvil | Traza E2E y aserción en base de datos |
| Reintentar | Envíos repetidos o en cola crean un solo rendimiento aceptado por operación | Integración con ID duplicado |
| Instantánea | Editar el plan fuente no cambia el historial de la sesión | Aserción antes/después y captura de interfaz |
| `%RM` | La prescripción se resuelve desde una marca nombrada con redondeo documentado | Matriz unitaria e inspección de instantánea |
| Detectar | Una desviación material crea un elemento correctamente priorizado | Prueba de dominio/consulta y recorrido del coach |
| Revisar | El coach inspecciona, confirma y registra la decisión de ajuste | Evidencia E2E o integración enfocada |
| Programar | Atleta y coach coinciden en siguiente sesión y pendiente/vencido | Pruebas de límites de zona y fecha |
| Acceso | Se rechazan acceso cruzado, activación vencida y atleta desconectado | Pruebas negativas de autorización y E2E |
| Recuperar | El equipo restaura un backup representativo y repite smoke checks | Notas fechadas del ensayo |

## Definición de preparación del piloto

El piloto está listo solo cuando todas estas afirmaciones son verdaderas:

- [ ] Todo lo obligatorio está completo; ningún opcional oculta un fallo bloqueante.
- [ ] Un recorrido representativo pasa de activación a sesión revisada.
- [ ] Un reintento duplicado/offline no duplica datos.
- [ ] El historial permanece intacto tras editar un plan.
- [ ] Coach y atleta comparten la semántica de calendario.
- [ ] No hay defectos abiertos de severidad 1 o 2 sobre pérdida de datos, autorización o finalización.
- [ ] Se ensayaron migración, backup, restauración, rollback y smoke tests.
- [ ] Están nombrados el responsable de soporte y la ruta de escalamiento.
- [ ] Las decisiones abiertas tienen responsable y fecha límite.

## Riesgos y reglas para reducir alcance

| Riesgo | Señal temprana | Respuesta | Regla de reducción |
|---|---|---|---|
| La migración amenaza el historial | Aparecen cascadas o mapeos nulos | Mantenerla aditiva; backfill separado; conservar lecturas antiguas | Quitar opcionales; no lanzar migración destructiva |
| Reintentos duplican series | Una acción produce varias filas | Unicidad de clave de operación en servidor | Admitir solo guardado en cola; diferir offline amplio |
| La bandeja crece sin límite | Aparecen nuevas excepciones durante el sprint | Congelar reglas del piloto y registrar candidatas | Conservar integridad, desviación, vencido y activación/sync |
| La fuente `%RM` es ambigua | Hay varias marcas actuales o ninguna | Exigir fuente y redondeo explícitos | Bloquear prescripción sin resolver; no adivinar |
| El calendario consume el sprint | Coach y atleta discrepan sobre “hoy” | Centralizar política de ocurrencias/fechas y probar zonas | Usar fechas del piloto; diferir reprogramación |
| Lo visual desplaza la confiabilidad | Comienza un rediseño antes de estabilizar datos | Limitar cambios a claridad/fricción del piloto | Diferir por completo taller y rediseño de marca |
| La coordinación genera conflictos | Ambos modifican esquema, acciones e interfaz | Separar comandos de proyecciones/interfaz e integrar a diario | Un responsable por límite; el otro crea fixtures/pruebas |

**Detención obligatoria:** si historial inmutable, finalización idempotente, autorización, ensayo de migración o restauración están en rojo, el piloto no se lanza. Reducir funciones, no integridad.

## Registro de decisiones y decisiones abiertas

| Decisión | Estado | Motivo / responsable |
|---|---|---|
| Conservar el stack y usar monolito modular | Confirmada | Ruta de menor riesgo para seis días |
| Modelar comprador, coach operador y atleta como actores conectados | Confirmada | El valor depende del ciclo completo |
| Usar instantáneas inmutables de ejecución | Dirección confirmada | Elimina el acoplamiento plan mutable/historial |
| Dejar multitenencia empresarial fuera del MVP inmediato | Confirmada | Los equipos importan; la infraestructura no demuestra el ciclo |
| Tratar la estética del deck solo como presentación | Confirmada | No existe una dirección visual final aprobada |
| Umbrales de desviación | Abierta | Responsable de producto + coach antes del día 1 |
| Precedencia de marca `%RM` e incremento de redondeo | Abierta | Producto + desarrollo antes del día 2 |
| Revisión de planes publicados | Abierta | Elegir identidad mínima o versión explícita en el día 1 |
| Cohorte, duración y soporte del piloto | Abierta | Deben definirse antes de decidir el lanzamiento |
| Fecha de retirada del PIN heredado | Operación pendiente | El modo seguro es predeterminado; falta ejecutar `0007`, distribuir tokens y fijar la fecha final de corte |

**Rollback de identidad:** `0007` es compatible como esquema aditivo, pero emitir, rotar o revocar credenciales neutraliza el PIN legado. Una reversión a código que sólo entiende PIN no recupera el login de esos atletas. Producción sigue sin migrar ni ejecutar el cutover; la recuperación requiere volver a la aplicación endurecida o un procedimiento operativo explícito de reemisión.

## Instrucciones de traspaso

El desarrollador receptor debe usar este documento como índice de ejecución y `PRODUCT.md` como verdad persistente del producto.

1. Leer `PRODUCT.md` y luego Resultado, Límite, Dirección de arquitectura y Evidencia de aceptación.
2. Verificar cada “ruta probable” contra la rama actual antes de editar; el repositorio puede haber cambiado.
3. Escribir el escenario del día 1 como fixture: un coach, un atleta, un programa publicado, una serie `%RM`, una carga absoluta, una desviación y un reintento.
4. Mantener revisable cada unidad: esquema/restricciones, comandos, proyección de lectura, bandeja y evidencia de lanzamiento.
5. Adjuntar evidencia a cada unidad. Una captura sin evidencia de base de datos o pruebas no demuestra integridad.
6. Actualizar el registro al cerrar decisiones. No ocultarlas en comentarios de implementación.
7. Detener y escalar si un cambio exige migración destructiva, debilita autorización o amplía el alcance.

## Orden exacto de implementación recomendado

1. Fijar escenario, reglas de desviación, fuente/redondeo `%RM` y transiciones del programa.
2. Agregar esquema aditivo de `workout_sessions` y `set_performances`, restricciones y fixtures representativos.
3. Completar inicio y guardado del ciclo general de sesión; la finalización del día ya tiene autorización, transacción e idempotencia.
4. Extender la estrategia offline sólo donde el piloto lo requiera; el cierre deriva un ID estable del día, sin `localStorage` ni cola detrás de series offline.
5. Resolver y guardar prescripciones `%RM` en el límite de ejecución.
6. Migrar historial y progreso a instantáneas; demostrar que editar planes no reescribe historial.
7. Centralizar calendario/pendientes y construir la proyección de bandeja.
8. ~~Agregar confirmación de revisión, logout y política explícita de PIN heredado.~~ Logout y política de PIN están implementados; la confirmación de revisión sigue pendiente.
9. Agregar duplicación de planificación solo con toda la evidencia obligatoria en verde.
10. Ensayar migración, backup/restauración, rollback, smoke checks y el recorrido completo; decidir lanzar o no según evidencia.
