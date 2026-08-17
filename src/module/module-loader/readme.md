# ModuleLoader

`ModuleLoader` es una utilidad reutilizable para **NetSuite SuiteScript 2.1** que permite cargar dinámicamente módulos y ejecutar funciones específicas según el tipo de registro y el contexto actual del script.

El objetivo principal es evitar duplicación de código en los Entry Points de NetSuite y centralizar la resolución de módulos mediante un `mapper`.

---

## Concepto

El flujo básico es:

```text
Entry Point
    │
    ▼
ModuleLoader
    │
    ├── scriptContext.newRecord.type
    │
    ▼
  Mapper
    │
    ▼
Ruta del módulo
    │
    ▼
 require()
    │
    ▼
  Handler
```

Por ejemplo:

```text
User Event
    │
    ▼
ModuleLoader
    │
    ├── salesorder → Sale Order.js
    ├── invoice    → Invoice.js
    └── customer   → Customer.js
```

El `ModuleLoader` **no contiene lógica de negocio**. Su responsabilidad es:

1. Validar los parámetros requeridos.
2. Identificar el tipo de registro.
3. Resolver el módulo correspondiente mediante el mapper.
4. Cargar dinámicamente el módulo.
5. Buscar el handler solicitado.
6. Ejecutar el handler.

---

# Constructor

```js
new ModuleLoader(mapper, scriptContext);
```

### Parámetros

| Parámetro       | Tipo     | Obligatorio | Descripción                                                |
| --------------- | -------- | ----------: | ---------------------------------------------------------- |
| `mapper`        | `Object` |          Sí | Mapa que relaciona tipos de registro con rutas de módulos. |
| `scriptContext` | `Object` |          Sí | Contexto proporcionado por NetSuite al Entry Point.        |

### Ejemplo

```js
const loader = new ModuleLoader(MAPPER_PATH, scriptContext);
```

---

# Mapper

El `mapper` define qué módulo debe manejar cada tipo de registro.

```js
const MAPPER_PATH = {
    salesorder: './transactions/Sale Order.js',
    invoice: './transactions/Invoice.js',
    customer: './entities/Customer.js',
};
```

La clave debe corresponder al valor de:

```js
scriptContext.newRecord.type;
```

Por ejemplo, para un Sales Order:

```js
scriptContext.newRecord.type;
// "salesorder"
```

El loader resolverá:

```js
MAPPER_PATH['salesorder'];
```

obteniendo:

```text
./transactions/Sale Order.js
```

---

# Método `load()`

```js
loader.load(functionName);
```

### Parámetros

| Parámetro      | Tipo     | Obligatorio | Descripción                                                    |
| -------------- | -------- | ----------: | -------------------------------------------------------------- |
| `functionName` | `String` |          Sí | Nombre del handler que se ejecutará dentro del módulo cargado. |

Ejemplo:

```js
loader.load('afterSubmit');
```

El loader buscará:

```js
Module.afterSubmit;
```

dentro del módulo resuelto.

---

# Ejemplo con User Event

Un User Event puede utilizar `ModuleLoader` como dispatcher.

```js
/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['../utils/ModuleLoader'], (ModuleLoader) => {
    const MAPPER_PATH = {
        salesorder: './transactions/Sale Order.js',
        invoice: './transactions/Invoice.js',
    };

    const beforeLoad = (scriptContext) => {
        const loader = new ModuleLoader(MAPPER_PATH, scriptContext);

        return loader.load('beforeLoad');
    };

    const beforeSubmit = (scriptContext) => {
        const loader = new ModuleLoader(MAPPER_PATH, scriptContext);

        return loader.load('beforeSubmit');
    };

    const afterSubmit = (scriptContext) => {
        const loader = new ModuleLoader(MAPPER_PATH, scriptContext);

        return loader.load('afterSubmit');
    };

    return {
        beforeLoad,
        beforeSubmit,
        afterSubmit,
    };
});
```

El User Event no necesita conocer la lógica específica de Sales Order o Invoice.

---

# Módulo Handler

El módulo cargado dinámicamente debe exportar los handlers que serán utilizados por el Entry Point.

Por ejemplo:

```js
define([], () => {
    const beforeLoad = (context) => {
        // Lógica específica de Sales Order
    };

    const beforeSubmit = (context) => {
        // Lógica específica de Sales Order
    };

    const afterSubmit = (context) => {
        // Lógica específica de Sales Order
    };

    return {
        beforeLoad,
        beforeSubmit,
        afterSubmit,
    };
});
```

Cuando el User Event ejecuta:

```js
loader.load('afterSubmit');
```

el `ModuleLoader` resolverá el módulo y ejecutará:

```js
Module.afterSubmit(scriptContext);
```

---

# Ejemplo con Client Script

`ModuleLoader` no está limitado a User Events.

También puede utilizarse con Client Scripts.

```js
/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(['../utils/ModuleLoader'], (ModuleLoader) => {
    const MAPPER_PATH = {
        salesorder: './transactions/Sale Order(Client).js',
        invoice: './transactions/Invoice(Client).js',
    };

    const pageInit = (scriptContext) => {
        const loader = new ModuleLoader(MAPPER_PATH, scriptContext);

        return loader.load('pageInit');
    };

    const fieldChanged = (scriptContext) => {
        const loader = new ModuleLoader(MAPPER_PATH, scriptContext);

        return loader.load('fieldChanged');
    };

    return {
        pageInit,
        fieldChanged,
    };
});
```

El módulo correspondiente podría ser:

```js
define([], () => {
    const pageInit = (context) => {
        // Lógica de Client Script
    };

    const fieldChanged = (context) => {
        // Lógica de Client Script
    };

    return {
        pageInit,
        fieldChanged,
    };
});
```

Esto permite reutilizar la misma infraestructura para diferentes tipos de SuiteScript.

---

# Manejo de errores

`ModuleLoader` valida que tanto el mapper como el contexto del script hayan sido proporcionados.

## Mapper no proporcionado

```js
new ModuleLoader(null, scriptContext);
```

genera:

```text
Mapper is required
```

## Contexto no proporcionado

```js
new ModuleLoader(MAPPER_PATH, null);
```

genera:

```text
Script context is required
```

## Tipo de registro sin configuración

Si el tipo de registro no existe en el mapper:

```js
const MAPPER_PATH = {
    salesorder: './transactions/Sale Order.js',
};
```

y el script se ejecuta sobre un Invoice, el loader simplemente finaliza:

```js
if (!pathModule) return;
```

No se carga ningún módulo ni se ejecuta ningún handler.

## Handler inexistente

Si se solicita:

```js
loader.load('afterSubmit');
```

pero el módulo no exporta `afterSubmit`, no se ejecutará ninguna función.

El loader verifica:

```js
if (typeof handler === 'function') {
    handler(this.scriptContext);
}
```

---

# Estructura recomendada

Una estructura de proyecto puede ser:

```text
src/
├── utils/
│   └── ModuleLoader.js
│
├── userEvents/
│   └── GlobalUserEvent.js
│
├── client/
│   └── GlobalClientScript.js
│
├── transactions/
│   ├── Sale Order.js
│   ├── Invoice.js
│   └── Purchase Order.js
│
└── entities/
    ├── Customer.js
    └── Vendor.js
```

Los Entry Points permanecen pequeños mientras que la lógica de negocio queda aislada en módulos específicos.

---

# Filosofía de diseño

`ModuleLoader` separa tres responsabilidades principales.

### Entry Point

Se encarga de:

- Recibir el evento de NetSuite.
- Crear el `ModuleLoader`.
- Indicar qué handler debe ejecutarse.

### ModuleLoader

Se encarga de:

- Resolver el módulo.
- Cargarlo dinámicamente.
- Buscar el handler.
- Ejecutar el handler.

### Módulo de negocio

Se encarga de:

- Lógica de negocio.
- Lógica específica del record.
- Comportamiento específico de cada evento.

De esta forma, la infraestructura y la lógica de negocio permanecen separadas.

---

# Ventajas

## Entry Points centralizados

En lugar de crear un User Event independiente para cada record:

```text
Sales Order UE
Invoice UE
Purchase Order UE
Customer UE
```

se puede utilizar un Entry Point común:

```text
Global User Event
       │
       ▼
 ModuleLoader
       │
       ├── Sales Order
       ├── Invoice
       ├── Purchase Order
       └── Customer
```

Esto resulta especialmente útil cuando una aplicación empieza a tener varios User Events relacionados.

---

## Menos código repetido

El Entry Point solamente define el mapper y delega la ejecución al `ModuleLoader`.

---

## Infraestructura reutilizable

El mismo `ModuleLoader` puede utilizarse potencialmente con:

- User Event
- Client Script
- Suitelet
- Scheduled Script
- Map/Reduce
- Otros Entry Points de SuiteScript

El requisito principal es que el contexto proporcionado permita resolver el módulo mediante el mapper.

---

## Separación de lógica

La lógica específica de cada record permanece dentro de su propio módulo.

Por ejemplo:

```text
Global User Event
       │
       ▼
 ModuleLoader
       │
       ▼
Sale Order.js
       │
       ├── beforeLoad()
       ├── beforeSubmit()
       └── afterSubmit()
```

El `Global User Event` no necesita conocer cómo funciona internamente Sales Order.

---

# Implementación actual

```js
define(['require'], (require) => {
    class ModuleLoader {
        constructor(mapper, scriptContext) {
            this.mapper = mapper;
            this.scriptContext = scriptContext;
        }

        load(functionName) {
            if (!this.mapper) {
                throw new Error('Mapper is required');
            }

            if (!this.scriptContext) {
                throw new Error('Script context is required');
            }

            const { newRecord } = this.scriptContext;
            const pathModule = this.mapper[newRecord.type];

            if (!pathModule) return;

            require([pathModule], (Module) => {
                const handler = Module?.[functionName];

                if (typeof handler === 'function') {
                    return handler(this.scriptContext);
                }
            });
        }
    }

    return ModuleLoader;
});
```

---

# Flujo completo

El patrón puede resumirse de la siguiente manera:

```text
                    NetSuite
                       │
                       ▼
                 Global Script
                       │
                       ▼
                 ModuleLoader
                       │
                       ▼
              scriptContext.newRecord
                       │
                       ▼
                  Record Type
                       │
                       ▼
                    Mapper
                       │
                       ▼
                Module Path
                       │
                       ▼
                    require()
                       │
                       ▼
                  Handler
                       │
                       ▼
               Business Logic
```

Por ejemplo:

```text
Sales Order
     │
     ▼
Global User Event
     │
     ▼
ModuleLoader
     │
     ▼
salesorder
     │
     ▼
Sale Order.js
     │
     ▼
afterSubmit()
```

---

# Objetivo

El objetivo de `ModuleLoader` no es eliminar los módulos de negocio, sino **evitar la creación innecesaria de múltiples Entry Points que contienen prácticamente la misma estructura**.

La arquitectura busca mantener:

```text
Entry Points
     ↓
Infrastructure
     ↓
Business Modules
```

con responsabilidades claramente separadas.

En proyectos pequeños, un User Event independiente puede ser suficiente. A medida que el proyecto crece y existen varios records que requieren la misma infraestructura, `ModuleLoader` permite centralizar los Entry Points sin centralizar la lógica de negocio.
