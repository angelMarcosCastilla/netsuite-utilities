/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 * @description Utility class to handle UI messages in NetSuite
 */
define(['N/ui/message'], (message) => {
    class MessageHandler {
        /**
         * @param {Object} form - NetSuite form instance (from serverWidget)
         */
        constructor(form) {
            this.form = form;
        }

        show({ title, message: msg, type = 'CONFIRMATION', showOnPageInit = true, duration = 0 }) {
            if (!this.form) throw new Error('Form instance not provided.');

            const uiMessage = message.create({
                title: title || 'Message',
                message: msg || '',
                type: type || message.Type.CONFIRMATION,
                duration: duration || 0,
            });

            if (showOnPageInit) {
                this.form.addPageInitMessage({ message: uiMessage });
            }

            return uiMessage;
        }

        success(msg, title = 'Success', duration = 0) {
            return this.show({ title, message: msg, type: message.Type.CONFIRMATION, duration });
        }

        error(msg, title = 'Error', duration = 0) {
            return this.show({ title, message: msg, type: message.Type.ERROR, duration });
        }

        warning(msg, title = 'Warning', duration = 0) {
            return this.show({ title, message: msg, type: message.Type.WARNING, duration });
        }

        info(msg, title = 'Info', duration = 0) {
            return this.show({ title, message: msg, type: message.Type.INFORMATION, duration });
        }
    }

    return MessageHandler;
});
