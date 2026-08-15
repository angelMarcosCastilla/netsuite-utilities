/**
 *
 * @NApiVersion 2.1
 */
define(['N/serverwidget'], (serverWidget) => {
    const FIELD_TYPE_ALIAS = {
        text: serverWidget.FieldType.TEXT,
        textarea: serverWidget.FieldType.TEXTAREA,
        richtext: serverWidget.FieldType.RICHTEXT,
        select: serverWidget.FieldType.SELECT,
        multiselect: serverWidget.FieldType.MULTISELECT,
        checkbox: serverWidget.FieldType.CHECKBOX,
        date: serverWidget.FieldType.DATE,
        datetime: serverWidget.FieldType.DATETIMETZ,
        integer: serverWidget.FieldType.INTEGER,
        float: serverWidget.FieldType.FLOAT,
        currency: serverWidget.FieldType.CURRENCY,
        percent: serverWidget.FieldType.PERCENT,
        email: serverWidget.FieldType.EMAIL,
        phone: serverWidget.FieldType.PHONE,
        url: serverWidget.FieldType.URL,
        password: serverWidget.FieldType.PASSWORD,
        label: serverWidget.FieldType.LABEL,
        inlinehtml: serverWidget.FieldType.INLINEHTML,
        file: serverWidget.FieldType.FILE,
        image: serverWidget.FieldType.IMAGE,
        help: serverWidget.FieldType.HELP,
    };

    const SUBLIST_TYPE_ALIAS = {
        list: serverWidget.SublistType.LIST,
        inlineeditor: serverWidget.SublistType.INLINEEDITOR,
        editor: serverWidget.SublistType.EDITOR,
        staticlist: serverWidget.SublistType.STATICLIST,
    };

    function resolveType(alias, map, fallback) {
        if (!alias) return fallback;
        return map[String(alias).toLowerCase()] || alias;
    }

    /**
     * FieldHandle: envuelve el N/serverwidget.Field recién creado.
     */
    class FieldHandle {
        constructor(nsField) {
            this.raw = nsField;
        }

        mandatory(isMandatory = true) {
            this.raw.isMandatory = isMandatory;
            return this;
        }
        defaultValue(value) {
            this.raw.defaultValue = value;
            return this;
        }
        displayType(displayType) {
            this.raw.updateDisplayType({ displayType });
            return this;
        }
        breakType(breakType) {
            this.raw.updateBreakType({ breakType });
            return this;
        }
        help(text) {
            this.raw.setHelpText({ help: text });
            return this;
        }
        readOnly() {
            return this.displayType(serverWidget.FieldDisplayType.INLINE);
        }
        hidden() {
            return this.displayType(serverWidget.FieldDisplayType.HIDDEN);
        }

        addSelectOption(value, text, isSelected = false) {
            this.raw.addSelectOption({ value, text, isSelected });
            return this;
        }

        options(list) {
            list.forEach((opt) => this.addSelectOption(opt.value, opt.text, opt.isSelected));
            return this;
        }

        /** Aplica configuración condicional sin cortar el encadenamiento. */
        when(condition, fn) {
            if (condition) fn(this);
            return this;
        }
    }

    function buildField(nsContainer, config, registry) {
        const nsField = nsContainer.addField({
            id: config.id,
            type: resolveType(config.type, FIELD_TYPE_ALIAS),
            label: config.label,
            source: config.source,
            container: config.container,
        });

        const handle = new FieldHandle(nsField);

        if (config.mandatory !== undefined) handle.mandatory(config.mandatory);
        if (config.defaultValue !== undefined) handle.defaultValue(config.defaultValue);
        if (config.help) handle.help(config.help);
        if (config.displayType) handle.displayType(config.displayType);
        if (config.breakType) handle.breakType(config.breakType);
        if (config.options) handle.options(config.options);

        registry[config.id] = handle;
        return handle;
    }

    // =====================================================================
    // SublistWrapper: envuelve N/serverwidget.Sublist
    // =====================================================================
    class SublistWrapper {
        constructor(nsSublist, parentForm) {
            this.raw = nsSublist;
            this._form = parentForm;
            this._fields = {};
        }

        /** Crea un field en la sublista. Devuelve el FieldHandle (no la sublista). */
        addField(config) {
            return buildField(this.raw, config, this._fields);
        }

        /** Azúcar para agregar varias columnas de una vez sin necesitar cada handle. */
        addFields(configs) {
            configs.forEach((c) => this.addField(c));
            return this;
        }

        getField(id) {
            return this._fields[id];
        }

        /** Agrega una fila completa: addRow({ item: 'A', qty: 2 }) */
        addRow(rowObject) {
            const line = this.raw.lineCount;
            Object.keys(rowObject).forEach((key) => {
                this.raw.setSublistValue({ id: key, line, value: String(rowObject[key]) });
            });
            return this;
        }

        /** Agrega varias filas de una vez: addRows([{...}, {...}]) */
        addRows(rows) {
            rows.forEach((row) => this.addRow(row));
            return this;
        }

        addButton(id, label, functionName) {
            this.raw.addButton({ id, label, functionName });
            return this;
        }

        addMarkAllButtons() {
            this.raw.addMarkAllButtons();
            return this;
        }

        /** Vuelve al FormWrapper padre para seguir configurando el formulario. */
        end() {
            return this._form;
        }
    }

    class FormWrapper {
        constructor(title, options = {}) {
            this.raw = serverWidget.createForm({ title, hideNavBar: !!options.hideNavBar });
            this._fields = {};
            this._sublists = {};
        }

        addField(config) {
            return buildField(this.raw, config, this._fields);
        }

        addFields(configs) {
            configs.forEach((c) => this.addField(c));
            return this;
        }

        getField(id) {
            return this._fields[id];
        }

        addTab(id, label) {
            this.raw.addTab({ id, label });
            return this;
        }
        addFieldGroup(id, label) {
            this.raw.addFieldGroup({ id, label });
            return this;
        }

        /** Crea y devuelve un SublistWrapper para encadenar .addField()/.addRow() */
        addSublist(config) {
            const nsSublist = this.raw.addSublist({
                id: config.id,
                type: resolveType(config.type, SUBLIST_TYPE_ALIAS, serverWidget.SublistType.LIST),
                label: config.label,
                tab: config.tab,
            });
            const wrapper = new SublistWrapper(nsSublist, this);
            this._sublists[config.id] = wrapper;
            return wrapper;
        }

        getSublist(id) {
            return this._sublists[id];
        }

        addSubmitButton(label = 'Save') {
            this.raw.addSubmitButton({ label });
            return this;
        }
        addResetButton(label = 'Reset') {
            this.raw.addResetButton({ label });
            return this;
        }
        addButton(id, label, functionName) {
            this.raw.addButton({ id, label, functionName });
            return this;
        }
        clientScript(modulePath) {
            this.raw.clientScriptModulePath = modulePath;
            return this;
        }

        build() {
            return this.raw;
        }
    }

    function createForm(title, options) {
        return new FormWrapper(title, options);
    }

    return { createForm };
});
