define(['require'], (require) => {
    class ModuleLoader {
        constructor(mapper, scriptContext) {
            this.mapper = mapper;
            this.scriptContext = scriptContext;
        }

        load(functionName) {
            if (!this.mapper) throw new Error('Mapper is required');
            if (!this.scriptContext) throw new Error('Script context is required');

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
