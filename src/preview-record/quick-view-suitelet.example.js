/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define([], () => {
    const failure = (message) => ({
        ok: false,
        message,
        error: message,
    });

    const requestReaders = {
        GET: (request) => ({
            ok: true,
            recordType: request.parameters.recordType,
            recordId: request.parameters.recordId,
        }),
        POST: (request) => {
            let body;

            try {
                body = JSON.parse(request.body || '{}');
            } catch (error) {
                return { ok: false, message: 'El cuerpo POST debe contener JSON válido.' };
            }

            if (!body || typeof body !== 'object' || Array.isArray(body)) {
                return { ok: false, message: 'El cuerpo POST debe ser un objeto JSON.' };
            }

            return {
                ok: true,
                recordType: body.recordType || body.record,
                recordId: body.recordId,
            };
        },
    };

    const getAddressQuickView = (recordId) => {
        const recordUrl = `/app/common/entity/custjob.nl?id=${encodeURIComponent(recordId)}`;

        return {
            ok: true,
            title: 'Dirección Principal Angel MC',
            url: recordUrl,
            fields: [
                { label: 'Departamento', value: 'Ica', type: 'text' },
                { label: 'Provincia', value: 'Chincha', type: 'text' },
                { label: 'Distrito', value: 'Chincha', type: 'text' },
                { label: 'Dirección', value: 'Calle los alamos 520', type: 'text' },
            ],
            actions: [
                { label: 'Ver', url: recordUrl },
                { label: 'Editar', url: `${recordUrl}&e=T` },
            ],
        };
    };

    const recordHandlers = {
        address: getAddressQuickView,
    };

    const hasOwn = (object, key) => Object.prototype.hasOwnProperty.call(object, key);

    const writeJson = (response, data) => {
        response.setHeader({
            name: 'Content-Type',
            value: 'application/json; charset=utf-8',
        });
        response.write({ output: JSON.stringify(data) });
    };

    const onRequest = (context) => {
        const method = context.request.method;
        const readRequest = hasOwn(requestReaders, method) ? requestReaders[method] : null;

        if (!readRequest) {
            writeJson(context.response, failure('Método HTTP no admitido.'));
            return;
        }

        const input = readRequest(context.request);
        if (!input.ok) {
            writeJson(context.response, failure(input.message));
            return;
        }

        if (
            typeof input.recordType !== 'string' ||
            (typeof input.recordId !== 'string' && typeof input.recordId !== 'number') ||
            !String(input.recordId).trim()
        ) {
            writeJson(context.response, failure('Se requieren record (o recordType) y recordId.'));
            return;
        }

        const recordType = input.recordType.trim();
        if (!recordType) {
            writeJson(context.response, failure('Se requieren record (o recordType) y recordId.'));
            return;
        }

        const handler = hasOwn(recordHandlers, recordType) ? recordHandlers[recordType] : null;
        if (!handler) {
            writeJson(
                context.response,
                failure(`No hay una vista previa disponible para "${recordType}".`),
            );
            return;
        }

        writeJson(context.response, handler(String(input.recordId)));
    };

    return { onRequest };
});
