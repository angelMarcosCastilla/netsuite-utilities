# Custom Quick View

`custom-quick-view.js` registra el elemento web `<custom-quick-view>`. Al pasar el
mouse sobre su contenido, consulta un Suitelet y muestra un popup con el título,
los campos y las acciones devueltos por ese Suitelet.

## Instalación

Sube `custom-quick-view.js` al File Cabinet de NetSuite y usa su ruta como módulo
AMD en el Client Script. Configura también la URL del deployment del Suitelet:

- Puedes indicarla en el atributo `endpoint` de cada elemento.
- O definir `window.CQV_ENDPOINT` antes de mostrar los elementos.
- Si no se indica ninguna de las anteriores, el componente usa
  `CustomQuickView.settings.defaultEndpoint`; actualiza ese valor en el módulo
  antes de desplegarlo, ya que el archivo contiene un marcador de posición.

El componente carga Floating UI desde la URL configurada en
`CustomQuickView.settings.floatingUrl`. Para no depender de una CDN, puedes
subir el bundle al File Cabinet y cambiar esa URL.

## Registrar en el Client Script

Importa el módulo y ejecuta `createQuickView()` desde la función principal
`pageInit`. La llamada registra el elemento una sola vez:

```javascript
define(['./custom-quick-view'], (QuickView) => {
    const pageInit = () => {
        window.CQV_ENDPOINT =
            '/app/site/hosting/scriptlet.nl?script=customscript_cqv_quickview_sl&deploy=customdeploy_cqv_quickview_sl';

        QuickView.createQuickView();
    };

    return { pageInit };
});
```

La ruta del módulo AMD debe corresponder a dónde hayas subido el módulo en el
File Cabinet. Configura los IDs del ejemplo con los del script y deployment
reales.

## Renderizar desde un Suitelet

Añade el elemento en un campo `INLINEHTML`. Los atributos `record` y `record-id`
identifican el tipo e ID del registro que el Suitelet debe presentar. El texto
entre las etiquetas es el contenido visible y activador del popup:

```javascript
const quickViewField = form.addField({
    id: 'custpage_address_quick_view',
    type: serverWidget.FieldType.INLINEHTML,
    label: ' ',
});

quickViewField.defaultValue =
    '<custom-quick-view record="address" record-id="1">Dirección Principal</custom-quick-view>';
```

También puedes definir el endpoint por elemento:

```html
<custom-quick-view
    record="address"
    record-id="1"
    endpoint="/app/site/hosting/scriptlet.nl?script=customscript_cqv_quickview_sl&deploy=customdeploy_cqv_quickview_sl"
>
    Dirección Principal
</custom-quick-view>
```

## Contrato de la respuesta

El componente actual hace una petición **GET** con estos parámetros:
`recordType` (el valor del atributo `record`) y `recordId` (el valor de
`record-id`). El Suitelet de ejemplo también acepta **POST** con un cuerpo JSON
como `{ "record": "address", "recordId": "1" }` o usando `recordType` en lugar de
`record`.

La respuesta exitosa debe ser JSON con `ok: true`. `title` se muestra como
encabezado; `fields` contiene las filas y `actions` los enlaces del pie:

```javascript
{
    ok: true,
    title: 'Dirección Principal Angel MC',
    url: '/app/common/entity/custjob.nl?id=123',
    fields: [
        { label: 'Departamento', value: 'Ica', type: 'text' },
        { label: 'Provincia', value: 'Chincha', type: 'text' },
        { label: 'Distrito', value: 'Chincha', type: 'text' },
        { label: 'Dirección', value: 'Calle los alamos 520', type: 'text' },
    ],
    actions: [
        { label: 'Ver', url: '/app/common/entity/custjob.nl?id=123' },
        { label: 'Editar', url: '/app/common/entity/custjob.nl?id=123&e=T' },
    ],
}
```

Tipos de campo admitidos:

- `text`: texto sin enlace.
- `email`: genera un enlace `mailto:`.
- `phone`: genera un enlace `tel:`.
- `url`: muestra un enlace que se abre en una pestaña nueva.
- `address`: muestra cada línea en una fila y puede incluir `mapUrl` y
  `mapLabel` para el enlace al mapa.

En cualquier campo se puede proporcionar `link` para usar un enlace
personalizado. Los enlaces `actions` requieren `label` y `url`. `url` en el
nivel superior establece el destino del texto del elemento si este no tiene un
atributo `href`.

Para errores o registros no admitidos, devuelve `ok: false` y un `message`
descriptivo. El ejemplo incluye además `error` con el mismo texto porque la
versión actual del componente muestra esa propiedad:

```javascript
{
    ok: false,
    message: 'No hay una vista previa disponible para este tipo de registro.',
    error: 'No hay una vista previa disponible para este tipo de registro.',
}
```

## Suitelet de ejemplo

[`quick-view-suitelet.example.js`](./quick-view-suitelet.example.js) simula una
respuesta para `address`, recibe el tipo e ID por GET o POST y despacha el
trabajo mediante un objeto de handlers, sin `switch`. Úsalo como base para
reemplazar los datos de demostración por búsquedas o lecturas del registro.
