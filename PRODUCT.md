# Producto

<!-- impeccable:product-schema 1 -->

## Plataforma

web

## Stack

Next.js 16 App Router, TypeScript, Tailwind CSS v4, Drizzle ORM con libSQL, Auth.js y Evolution API para la activación de atletas por WhatsApp.

## Usuarios

- **Dueño/coach comprador:** evalúa el estado operativo y comercial, necesita comprender qué hace el sistema y debe confiar lo suficiente en él para seguir pagando por su uso.
- **Coach operador:** crea y ajusta entrenamientos, revisa la ejecución, detecta desviaciones y decide la siguiente intervención.
- **Atleta:** recibe el plan, lo ejecuta y registra el rendimiento real con la menor fricción posible.
- La existencia de varios coaches y equipos es relevante cuando el contexto operativo lo requiere. La multitenencia empresarial no es un requisito inmediato del MVP.

## Propósito del producto

Forja es un sistema operativo vertical para coaches de powerlifting y gimnasios. Conecta el ciclo completo de coaching:

`programar -> ejecutar -> detectar desviaciones -> revisar -> ajustar`

El éxito significa que un coach puede prescribir trabajo de manera confiable, ver qué ocurrió sin reconstruirlo manualmente y actuar ante las desviaciones, mientras el atleta puede completar y registrar el entrenamiento con poca fricción.

## Posicionamiento

Forja integra el diseño del programa, la ejecución del atleta, la detección de desviaciones, la revisión del coach y el ajuste en un único ciclo operativo específico para powerlifting. Su diferencial es la continuidad de ese ciclo, no una colección de funciones desconectadas de planificación, seguimiento o mensajería.

## Contexto operativo

- Los coaches administran perfiles de atletas, programas, marcas, historial de entrenamiento y datos de pruebas de fuerza.
- Los atletas utilizan una experiencia diaria de entrenamiento y progreso orientada a dispositivos móviles.
- La incorporación actual permite que el coach envíe invitaciones por WhatsApp y códigos de activación de un solo uso.
- La importación y exportación con Excel siguen siendo parte de la transición desde los flujos de trabajo existentes.
- El entrenamiento puede registrarse mediante una cola sin conexión parcial cuando la conectividad no es confiable.
- La interfaz actual utiliza una combinación oscura de grafito, tiza, acero y acentos moderados. Esto constituye evidencia de implementación, no la aprobación de una dirección visual definitiva.

## Capacidades y restricciones

Las capacidades cuyo funcionamiento está confirmado incluyen autenticación y panel del coach, gestión y perfiles de atletas, planificación de programas, registro de series y días, acceso del atleta mediante PIN, vistas de entrenamiento y progreso del atleta, marcas de fuerza, importación/exportación con Excel, activación OTP por WhatsApp y una cola sin conexión parcial.

Restricciones y brechas conocidas:

- La ejecución persiste instantáneas independientes de programa, día, ejercicio, prescripción resuelta y resultado; modificar o retirar un plan no altera esa evidencia.
- Las escrituras de series usan identificadores de mutación idempotentes y distinguen confirmación, pendiente y conflicto sin conexión.
- El cierre de una sesión exige que cada serie esté registrada u omitida explícitamente.
- Los programas admiten borradores versionados y publicación explícita; el programa publicado permanece vigente mientras se prepara otro.
- El panel del coach prioriza excepciones respaldadas por fechas, series, marcas y activaciones existentes.
- El cierre de sesión del atleta y la retirada del acceso heredado mediante PIN están incompletos.
- CI, la cobertura E2E, las operaciones de lanzamiento y los procedimientos de recuperación están incompletos.

Decisiones abiertas:

- Gimnasio piloto, grupo de atletas y duración exacta del piloto.
- Reglas mínimas de desviación que deben ingresar a la bandeja del coach durante el piloto.
- Política de edición posterior a la publicación más allá de las instantáneas de ejecución y el versionado de borradores actuales.
- Fecha de retirada del PIN heredado y política de migración de atletas.
- La evolución futura de la identidad podrá refinar detalles, pero debe conservar la dirección visual aprobada y documentada en DESIGN.md.

## Compromisos de marca

- El nombre del producto es **Forja**.
- La comunicación del producto debe ser directa, operativa y basada en la práctica del powerlifting.
- Forja es la marca principal; la identidad del gimnasio o tenant es secundaria.
- La dirección visual aprobada es “Gym Sport / Sala de competencia”: superficies minerales claras, azul reglamentario, rojo reservado para decisiones, reglas nítidas, referencias contenidas a goma/acero/plataforma/tiza y composición basada en tarjetas de entrenamiento y tableros de resultado.

## Evidencia disponible

- El repositorio contiene implementaciones funcionales de los recorridos actuales de coaches, atletas, planificación, marcas, importación/exportación, activación y funcionamiento parcial sin conexión.
- Las pruebas automatizadas existentes cubren autorización, incorporación de atletas, comportamiento de Evolution API y recorridos E2E limitados de inicio y activación.
- No hay testimonios aprobados, métricas de clientes, evidencia de precios ni afirmaciones comerciales disponibles; el trabajo futuro no debe inventarlos.

## Principios del producto

1. Preservar el ciclo completo de coaching en lugar de optimizar un actor de forma aislada.
2. La ejecución histórica debe seguir siendo confiable después de modificar un plan.
3. Mostrar las excepciones accionables antes que la actividad agregada.
4. Mantener el registro del atleta más rápido que el flujo de trabajo que reemplaza.
5. Incorporar complejidad operativa únicamente cuando el piloto demuestre que es necesaria.

## Accesibilidad e inclusión

La experiencia web debe seguir siendo utilizable en dispositivos móviles y de escritorio, preservar la navegación por teclado y el foco visible, mantener un contraste legible y evitar que el color sea el único medio para comunicar el estado del entrenamiento o el significado de una desviación.
