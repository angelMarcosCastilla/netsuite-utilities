define([], function () {
    /**
     * diffLines()
     * Detecta cambios en un sublist (ej: item) usando lineuniquekey.
     * Devuelve:
     *  - added:    líneas nuevas
     *  - removed:  líneas eliminadas
     *  - updated:  líneas modificadas (con detalle exacto)
     *  - hasChange: true/false si hubo cualquier cambio
     *
     * @param {Record} oldRec
     * @param {Record} newRec
     * @param {string} sublistId
     * @param {string[]} fields
     */
    function diffLines(oldRec, newRec, sublistId, fields = []) {
        const extractLines = (rec) => {
            if (!rec) return {};

            const map = {};
            const count = rec.getLineCount({ sublistId });

            for (let i = 0; i < count; i++) {
                const key = rec.getSublistValue({
                    sublistId,
                    fieldId: 'lineuniquekey',
                    line: i,
                });

                const values = {};
                fields.forEach((f) => {
                    values[f] = rec.getSublistValue({
                        sublistId,
                        fieldId: f,
                        line: i,
                    });
                });

                map[key] = values;
            }
            return map;
        };

        const oldMap = extractLines(oldRec);
        const newMap = extractLines(newRec);

        const result = {
            added: [],
            removed: [],
            updated: [],
            hasChange: false,
        };

        // NUEVAS y MODIFICADAS
        for (const key in newMap) {
            // NUEVA LÍNEA
            if (!oldMap[key]) {
                result.added.push({
                    key,
                    values: newMap[key],
                });
                result.hasChange = true;
                continue;
            }

            // MODIFICADA
            const diffDetails = [];

            fields.forEach((f) => {
                const oldValue = oldMap[key][f];
                const newValue = newMap[key][f];

                if (oldValue !== newValue) {
                    diffDetails.push({
                        field: f,
                        old: oldValue,
                        new: newValue,
                    });
                }
            });

            if (diffDetails.length > 0) {
                result.updated.push({
                    key,
                    details: diffDetails,
                    oldValues: oldMap[key],
                    newValues: newMap[key],
                });
                result.hasChange = true;
            }
        }

        // ELIMINADAS
        for (const key in oldMap) {
            if (!newMap[key]) {
                result.removed.push({
                    key,
                    values: oldMap[key],
                });
                result.hasChange = true;
            }
        }

        return result;
    }

    return diffLines;
});
