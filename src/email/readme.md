# EmailBuilder

Builder pattern para construir emails de forma fluida y mantenible en SuiteScript 2.1.

## Características

- Fluent API
- Validaciones centralizadas
- Deduplicación automática
- Objetos inmutables
- Compatible con `N/email`
- Arquitectura limpia y extensible

---

# Instalación

```text
/FileCabinet/SuiteScripts/lib/EmailBuilder.js
```

---

# Uso básico

```javascript
define(['./lib/EmailBuilder', 'N/email'], (EmailBuilder, email) => {
    const execute = () => {
        const emailData = new EmailBuilder()
            .setSender(10)

            .addRecipient(['customer@test.com', 'finance@test.com'])

            .addCc('manager@test.com')

            .setSubject('Invoice Generated')

            .setBody(
                `
                <h1>Hello</h1>
                <p>Your invoice is ready.</p>
            `,
            )

            .relateToTransaction(1001)

            .relateToEntity(500)

            .build();

        email.send(emailData);
    };

    return { execute };
});
```

---

# API

## Sender

```javascript
.setSender(senderId)
```

## Recipients

```javascript
.addRecipient(recipient | recipients[])
.addCc(recipient | recipients[])
.addBcc(recipient | recipients[])
```

## Content

```javascript
.setSubject(subject)
.setBody(body)
```

## Attachments

```javascript
.addAttachment(fileObj)
.addAttachments(files[])
```

## Related Records

```javascript
.relateToTransaction(transactionId)
.relateToEntity(entityId)
.relateToActivity(activityId)
.relateToCustomRecord(recordType, id)
```

## Build

```javascript
.build()
```

Construye el payload final compatible con `N/email.send()`.

---

# Ejemplo de salida

```javascript
{
    author: 10,
    recipients: ['customer@test.com'],
    cc: [],
    bcc: [],
    subject: 'Welcome',
    body: '<h1>Hello</h1>',
    attachments: [],
    relatedRecords: {
        transactionId: 1001
    }
}
```

---

# Buenas prácticas

- Mantener el builder puro
- Separar lógica de envío en un `EmailService`
- Reutilizar templates HTML
- Evitar lógica de negocio dentro del builder

---

# Compatibilidad

- SuiteScript 2.1
- Map/Reduce
- Scheduled Scripts
- Suitelets
- RESTlets
