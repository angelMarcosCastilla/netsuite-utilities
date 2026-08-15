# form-builder

Wrapper fluido sobre `N/serverwidget` para reducir el boilerplate al crear
formularios (Suitelets) en SuiteScript 2.1 — sin alejarse de cómo funciona
la API nativa de NetSuite.

## Índice

- [Instalación](#instalación)
- [Inicio rápido](#inicio-rápido)
- [Conceptos clave](#conceptos-clave)
- [API: `createForm`](#api-createform)
- [API: `FormWrapper`](#api-formwrapper)
- [API: `FieldHandle`](#api-fieldhandle)
- [API: `SublistWrapper`](#api-sublistwrapper)
- [Tipos de campo soportados](#tipos-de-campo-soportados)
- [Tipos de sublista soportados](#tipos-de-sublista-soportados)
- [Campos condicionales](#campos-condicionales)
- [Trabajar con sublistas y filas](#trabajar-con-sublistas-y-filas)
- [Escape hatch: acceso a la API nativa](#escape-hatch-acceso-a-la-api-nativa)
- [Ejemplo completo (Suitelet)](#ejemplo-completo-suitelet)
- [FAQ](#faq)

---

## Instalación

1. Sube `form-builder` al File Cabinet, en la misma carpeta que tus
   Suitelets (o en una carpeta compartida tipo `SuiteScripts/lib`).
2. Impórtalo con una ruta relativa o absoluta en tu `define`:

```javascript
/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/serverwidget', './form-builder'], (serverWidget, ns) => {
    const { createForm } = ns;
    // ...
});
```

No requiere ninguna dependencia externa, solo `N/serverwidget`.

---

## Inicio rápido

```javascript
const form = createForm('Mi Formulario');

form.addField({
    type: 'text',
    id: 'custpage_nombre',
    label: 'Nombre',
    mandatory: true,
});

form.addSubmitButton('Guardar');

response.writePage(form.build());
```

Esto reemplaza el equivalente nativo:

```javascript
const form = serverWidget.createForm({ title: 'Mi Formulario' });
const nameField = form.addField({
    id: 'custpage_nombre',
    type: serverWidget.FieldType.TEXT,
    label: 'Nombre',
});
nameField.isMandatory = true;
form.addSubmitButton({ label: 'Guardar' });
response.writePage(form);
```

---

## Conceptos clave

| Concepto         | Qué es                                                                                                                                                                 |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `FormWrapper`    | Envuelve `serverWidget.Form`. Lo obtienes con `createForm(title)`.                                                                                                     |
| `FieldHandle`    | Envuelve un `serverWidget.Field` ya creado. Lo devuelve `addField()`. Permite seguir configurando el campo con métodos encadenables (`.mandatory()`, `.help()`, etc.). |
| `SublistWrapper` | Envuelve `serverWidget.Sublist`. Lo devuelve `form.addSublist()`.                                                                                                      |
| `.raw`           | Cada wrapper expone `.raw`, el objeto nativo real de `N/serverwidget`, por si necesitas algo que el wrapper no cubre.                                                  |

**Regla mental:** `addField()` siempre devuelve el **campo** (como la API
nativa). `addSublist()` devuelve la **sublista** (para poder encadenar
`.addField()` / `.addRow()` sobre ella).

---

## API: `createForm`

```javascript
createForm(title: string, options?: { hideNavBar?: boolean }): FormWrapper
```

Crea el formulario y devuelve un `FormWrapper`.

```javascript
const form = createForm('Solicitud de Compra', { hideNavBar: true });
```

---

## API: `FormWrapper`

### `form.addField(config)` → `FieldHandle`

Crea un campo en el formulario y devuelve su `FieldHandle`.

```javascript
const config = {
    type: 'text' | 'textarea' | 'select' | ... , // ver tabla de tipos
    id: string,          // requerido
    label: string,
    source: string,      // lista/record de origen (para SELECT)
    container: string,   // id de un fieldGroup, si aplica
    mandatory: boolean,
    defaultValue: any,
    help: string,
    displayType: serverWidget.FieldDisplayType.*,
    breakType: serverWidget.FieldBreakType.*,
    options: [{ value, text, isSelected? }]  // para SELECT/MULTISELECT
};

const deptField = form.addField(config);
```

### `form.addFields(configs: Array)` → `FormWrapper`

Azúcar para agregar varios campos de una vez cuando **no** necesitas el
handle individual de cada uno. Devuelve el propio `form` para seguir
encadenando.

```javascript
form.addFields([
    { type: 'text', id: 'custpage_nombre', label: 'Nombre' },
    { type: 'email', id: 'custpage_email', label: 'Email' },
]).addSubmitButton('Guardar');
```

### `form.getField(id)` → `FieldHandle | undefined`

Recupera el handle de un campo ya agregado (por si la lógica condicional
llega después en el flujo del script).

```javascript
form.getField('custpage_nombre').mandatory();
```

### `form.addTab(id, label)` → `FormWrapper`

### `form.addFieldGroup(id, label)` → `FormWrapper`

```javascript
form.addTab('custpage_tab_detalle', 'Detalle');
form.addFieldGroup('custpage_grupo_contacto', 'Contacto');
```

### `form.addSublist(config)` → `SublistWrapper`

```javascript
const items = form.addSublist({
    type: 'inlineeditor' | 'list' | 'editor' | 'staticlist',
    id: 'custpage_items',
    label: 'Items',
    tab: 'custpage_tab_detalle', // opcional
});
```

### `form.getSublist(id)` → `SublistWrapper | undefined`

### `form.addSubmitButton(label = 'Save')` → `FormWrapper`

### `form.addResetButton(label = 'Reset')` → `FormWrapper`

### `form.addButton(id, label, functionName)` → `FormWrapper`

```javascript
form.addButton('custpage_btn_calc', 'Calcular Total', 'calcularTotal');
```

### `form.clientScript(modulePath)` → `FormWrapper`

```javascript
form.clientScript('./mi-cliente.js');
```

### `form.build()` → `serverWidget.Form`

Devuelve el objeto **nativo**, listo para `response.writePage(form.build())`.

---

## API: `FieldHandle`

Lo que recibes de `addField()`. Todos los métodos devuelven `this`
(el propio handle), excepto donde se indica.

| Método                                       | Descripción                                                                          |
| -------------------------------------------- | ------------------------------------------------------------------------------------ |
| `.mandatory(isMandatory = true)`             | Marca el campo obligatorio (o no, si pasas `false`).                                 |
| `.defaultValue(value)`                       | Define el valor por defecto.                                                         |
| `.displayType(displayType)`                  | `serverWidget.FieldDisplayType.*` (ej. `HIDDEN`, `INLINE`, `DISABLED`).              |
| `.breakType(breakType)`                      | `serverWidget.FieldBreakType.*`.                                                     |
| `.help(text)`                                | Texto de ayuda (tooltip) del campo.                                                  |
| `.readOnly()`                                | Atajo de `.displayType(INLINE)`.                                                     |
| `.hidden()`                                  | Atajo de `.displayType(HIDDEN)`.                                                     |
| `.addSelectOption(value, text, isSelected?)` | Agrega una opción a un SELECT/MULTISELECT.                                           |
| `.options(list)`                             | Agrega varias opciones: `[{ value, text, isSelected? }]`.                            |
| `.when(condition, fn)`                       | Ejecuta `fn(handle)` solo si `condition` es verdadero, sin cortar el encadenamiento. |
| `.raw`                                       | El `serverWidget.Field` nativo (propiedad, no método).                               |

```javascript
form.addField({ type: 'select', id: 'custpage_dep', label: 'Departamento' })
    .options([
        { value: '1', text: 'Ventas' },
        { value: '2', text: 'TI' },
    ])
    .when(parametro === 'x', (f) => f.mandatory().help('Obligatorio en este caso'));
```

---

## API: `SublistWrapper`

Lo que recibes de `form.addSublist()`.

### `.addField(config)` → `FieldHandle`

Igual que `form.addField`, pero crea la columna dentro de la sublista.

### `.addFields(configs)` → `SublistWrapper`

Azúcar para agregar varias columnas de una vez.

```javascript
items.addFields([
    { type: 'text', id: 'item', label: 'Artículo' },
    { type: 'integer', id: 'cantidad', label: 'Cantidad' },
    { type: 'currency', id: 'costo', label: 'Costo Unitario' },
]);
```

### `.getField(id)` → `FieldHandle | undefined`

### `.addRow(rowObject)` → `SublistWrapper`

Agrega una fila completa a partir de un objeto plano `{ columnId: valor }`.
Internamente resuelve la línea (`lineCount`) y llama `setSublistValue` por
cada key. Devuelve la sublista para poder encadenar más filas.

```javascript
items.addRow({ item: 'Laptop', cantidad: 2, costo: 1200 }).addRow({ item: 'Monitor', cantidad: 4, costo: 250 });
```

### `.addRows(rows: Array)` → `SublistWrapper`

Carga varias filas de una vez, típicamente desde el resultado de un
`N/search`.

```javascript
const filas = resultadosBusqueda.map((r) => ({
    item: r.getText({ name: 'item' }),
    cantidad: r.getValue({ name: 'quantity' }),
}));

items.addRows(filas);
```

### `.addButton(id, label, functionName)` → `SublistWrapper`

### `.addMarkAllButtons()` → `SublistWrapper`

### `.end()` → `FormWrapper`

Vuelve al formulario padre para seguir encadenando a nivel de formulario.

```javascript
form.addSublist({ type: 'list', id: 'custpage_items', label: 'Items' })
    .addField({ type: 'text', id: 'item', label: 'Item' })
    .end()
    .addSubmitButton('Guardar');
```

---

## Tipos de campo soportados

Puedes usar el alias en minúsculas (string) o la constante nativa de
`serverWidget.FieldType` directamente — ambos funcionan.

| Alias           | Constante nativa        |
| --------------- | ----------------------- |
| `'text'`        | `FieldType.TEXT`        |
| `'textarea'`    | `FieldType.TEXTAREA`    |
| `'richtext'`    | `FieldType.RICHTEXT`    |
| `'select'`      | `FieldType.SELECT`      |
| `'multiselect'` | `FieldType.MULTISELECT` |
| `'checkbox'`    | `FieldType.CHECKBOX`    |
| `'date'`        | `FieldType.DATE`        |
| `'datetime'`    | `FieldType.DATETIMETZ`  |
| `'integer'`     | `FieldType.INTEGER`     |
| `'float'`       | `FieldType.FLOAT`       |
| `'currency'`    | `FieldType.CURRENCY`    |
| `'percent'`     | `FieldType.PERCENT`     |
| `'email'`       | `FieldType.EMAIL`       |
| `'phone'`       | `FieldType.PHONE`       |
| `'url'`         | `FieldType.URL`         |
| `'password'`    | `FieldType.PASSWORD`    |
| `'label'`       | `FieldType.LABEL`       |
| `'inlinehtml'`  | `FieldType.INLINEHTML`  |
| `'file'`        | `FieldType.FILE`        |
| `'image'`       | `FieldType.IMAGE`       |
| `'help'`        | `FieldType.HELP`        |

Si necesitas un tipo que no está en la tabla, pasa la constante directa:

```javascript
form.addField({ type: serverWidget.FieldType.TIMEOFDAY, id: 'custpage_hora', label: 'Hora' });
```

## Tipos de sublista soportados

| Alias            | Constante nativa           |
| ---------------- | -------------------------- |
| `'list'`         | `SublistType.LIST`         |
| `'inlineeditor'` | `SublistType.INLINEEDITOR` |
| `'editor'`       | `SublistType.EDITOR`       |
| `'staticlist'`   | `SublistType.STATICLIST`   |

---

## Campos condicionales

Tres formas de manejar reglas que dependen de un parámetro (ej. el campo
es obligatorio solo en ciertos casos), de más a menos recomendada:

**1. Boolean directo en `mandatory`:**

```javascript
form.addField({
    type: 'select',
    id: 'custpage_dep',
    label: 'Departamento',
    mandatory: parametro === 'x',
});
```

**2. `.when()` inline, sin cortar el encadenamiento:**

```javascript
form.addField({ type: 'select', id: 'custpage_dep', label: 'Departamento' })
    .options([{ value: '1', text: 'Ventas' }])
    .when(parametro === 'x', (f) => f.mandatory().help('Obligatorio en este caso'));
```

**3. Capturando el handle en variable, para lógica más elaborada:**

```javascript
const deptField = form.addField({ type: 'select', id: 'custpage_dep', label: 'Departamento' });

if (parametro === 'x') {
    deptField.mandatory().help('Obligatorio para este tipo de solicitud');
} else if (parametro === 'y') {
    deptField.hidden();
}
```

**4. Post-hoc con `getField()`**, cuando la condición se conoce más tarde
en el script (por ejemplo, tras una búsqueda):

```javascript
form.addField({ type: 'select', id: 'custpage_dep', label: 'Departamento' });
// ... más código ...
form.getField('custpage_dep').mandatory(condicionTardía);
```

---

## Trabajar con sublistas y filas

```javascript
const items = form.addSublist({ type: 'inlineeditor', id: 'custpage_items', label: 'Items' });

items.addFields([
    { type: 'text', id: 'item', label: 'Artículo' },
    { type: 'integer', id: 'cantidad', label: 'Cantidad' },
    { type: 'currency', id: 'costo', label: 'Costo Unitario' },
]);

items.addRow({ item: 'Laptop', cantidad: 2, costo: 1200 }).addRow({ item: 'Monitor', cantidad: 4, costo: 250 });
```

Leer las filas del lado del cliente al procesar el POST sigue el patrón
nativo de `N/serverwidget` (esto no cambia, es del `request` object):

```javascript
const lineCount = context.request.getLineCount({ group: 'custpage_items' });

for (let i = 0; i < lineCount; i++) {
    const item = context.request.getSublistValue({ group: 'custpage_items', name: 'item', line: i });
    // ...
}
```

---

## Escape hatch: acceso a la API nativa

Todo wrapper expone `.raw` con el objeto real de `N/serverwidget`, por si
necesitas algo que la librería no cubre todavía:

```javascript
const deptField = form.addField({ type: 'select', id: 'custpage_dep', label: 'Departamento' });

// Método nativo que no está en el wrapper, ej. setDisplayType con opciones avanzadas
deptField.raw.updateLayoutType({ layoutType: serverWidget.FieldLayoutType.OUTSIDEBELOW });
```

Lo mismo aplica a `form.raw` y `sublist.raw`.

---

## Ejemplo completo (Suitelet)

```javascript
/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/serverwidget', './form-builder'], (serverWidget, ns) => {
    const { createForm } = ns;

    function onRequest(context) {
        if (context.request.method === 'GET') {
            renderForm(context);
        } else {
            procesarFormulario(context);
        }
    }

    function renderForm(context) {
        const parametro = context.request.parameters.custparam_tipo;

        const form = createForm('Solicitud de Compra');

        form.addField({
            type: 'text',
            id: 'custpage_solicitante',
            label: 'Solicitante',
            mandatory: true,
        });

        const deptField = form.addField({
            type: 'select',
            id: 'custpage_departamento',
            label: 'Departamento',
            options: [
                { value: '1', text: 'Ventas' },
                { value: '2', text: 'Operaciones' },
                { value: '3', text: 'TI' },
            ],
        });

        if (parametro === 'x') {
            deptField.mandatory().help('Obligatorio para este tipo de solicitud');
        }

        form.addField({ type: 'date', id: 'custpage_fecha', label: 'Fecha', defaultValue: new Date() });
        form.addField({ type: 'currency', id: 'custpage_total', label: 'Total Estimado' }).readOnly();

        const items = form.addSublist({ type: 'inlineeditor', id: 'custpage_items', label: 'Items Solicitados' });
        items.addFields([
            { type: 'text', id: 'item', label: 'Artículo' },
            { type: 'integer', id: 'cantidad', label: 'Cantidad' },
            { type: 'currency', id: 'costo', label: 'Costo Unitario' },
        ]);
        items.addRow({ item: 'Laptop', cantidad: 2, costo: 1200 }).addRow({ item: 'Monitor', cantidad: 4, costo: 250 });

        form.addSubmitButton('Enviar Solicitud');

        context.response.writePage(form.build());
    }

    function procesarFormulario(context) {
        const req = context.request;
        const solicitante = req.parameters.custpage_solicitante;
        const lineCount = req.getLineCount({ group: 'custpage_items' });

        const lineas = [];
        for (let i = 0; i < lineCount; i++) {
            lineas.push({
                item: req.getSublistValue({ group: 'custpage_items', name: 'item', line: i }),
                cantidad: req.getSublistValue({ group: 'custpage_items', name: 'cantidad', line: i }),
                costo: req.getSublistValue({ group: 'custpage_items', name: 'costo', line: i }),
            });
        }

        context.response.write(`Solicitud recibida de ${solicitante} con ${lineas.length} líneas.`);
    }

    return { onRequest };
});
```

---

## FAQ

**¿Por qué `addField` devuelve el field y `addSublist` devuelve la sublista, y no ambos devuelven el form?**
Porque así se comporta la API nativa de NetSuite (`form.addField()` devuelve
el `Field`), y porque normalmente sigues configurando el campo recién creado
(`.mandatory()`, `.help()`) o agregando columnas/filas a la sublista recién
creada — encadenar hacia el form no es lo más común en ninguno de los dos casos.

**¿Cómo agrego muchos campos sin escribir `form.addField` mil veces?**
Usa `form.addFields([...])` quien acepta un arreglo de configs y te devuelve
el `form` para seguir encadenando.

**¿Puedo mezclar esta librería con código nativo de `N/serverwidget`?**
Sí. Todos los wrappers exponen `.raw` con el objeto nativo real, así que
puedes combinar ambos estilos sin problema.

**¿Sirve para Client Scripts?**
No — `N/serverwidget` solo aplica a scripts server-side (Suitelets,
User Event `beforeLoad`, etc.). Para Client Scripts se usa `N/currentRecord`,
que tiene una API distinta.

**¿Necesito declarar `@NApiVersion 2.1` en los scripts que lo consumen?**
Sí, la librería usa sintaxis ES6 (clases, arrow functions, destructuring),
que solo está disponible en SuiteScript 2.1.
