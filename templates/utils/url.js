define(['N/url'], function (url) {
    function resolveUrlRecord(recordType, recordId) {
        const domain = url.resolveDomain({ hostType: url.HostType.APPLICATION });
        const baseDomain = `https://${domain}`;

        const recordUrl = url.resolveRecord({
            recordType: recordType,
            recordId: recordId,
            isEditMode: false,
        });

        return `${baseDomain}${recordUrl}`;
    }

    return { resolveUrlRecord };
});
