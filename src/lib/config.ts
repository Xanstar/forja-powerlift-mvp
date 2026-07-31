// Cada instancia de la app pertenece a un solo gimnasio/entrenador.
// El nombre y las credenciales del admin se configuran por entorno (env),
// así cada deploy es una app "personificada" con su propio link y datos.

export const appName = process.env.APP_NAME || "Forja";
