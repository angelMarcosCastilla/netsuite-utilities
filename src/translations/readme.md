# TranslationManager

Helper de traducciones para SuiteScript 2.1 con:

- detección automática de idioma
- fallback automático
- placeholders dinámicos
- diccionarios reutilizables

---

# Instalación

## TranslationManager.js

```text
/FileCabinet/SuiteScripts/lib/TranslationManager.js
```

---

# Ejemplo de diccionario

```javascript
define([], function () {
    const TRANSLATIONS = {
        HELLO_WORLD: {
            en: 'Hello World',
            es: 'Hola Mundo',
            pt: 'Olá Mundo',
        },

        HELLO_USER: {
            en: 'Hello {name}',
            es: 'Hola {name}',
            pt: 'Olá {name}',
        },
    };

    return TRANSLATIONS;
});
```

---

# Uso básico

```javascript
define(['./lib/TranslationManager', './constants/translations'], function (TranslationManager, TRANSLATIONS) {
    const translation = new TranslationManager({
        customTranslation: TRANSLATIONS,
    });

    const text = translation.get('HELLO_WORLD');

    log.debug('text', text);
});
```

---

# Uso con parámetros

```javascript
const text = translation.get('HELLO_USER', {
    name: 'John',
});
```

Resultado:

```text
Hola John
```

---

# Comportamiento fallback

Si el idioma actual no existe:

- usa `en` automáticamente
- si la key no existe, retorna la key

Ejemplo:

```javascript
translation.get('UNKNOWN_KEY');
```

Resultado:

```text
UNKNOWN_KEY
```

---

# Idiomas soportados

- en
- es
- pt

---

# API

## get(key, params)

Retorna el texto traducido.

```javascript
translation.get('HELLO_WORLD');
```

```javascript
translation.get('HELLO_USER', {
    name: 'John',
});
```

---

# Características

- ligero
- reutilizable
- desacoplado
- compatible con SuiteScript 2.1
- interpolación de parámetros
- detección automática de idioma
- fácil mantenimiento
