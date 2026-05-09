define([], () => {
    class EmailBuilder {
        constructor() {
            this.email = {
                author: null,
                recipients: new Set(),
                cc: new Set(),
                bcc: new Set(),
                subject: '',
                body: '',
                attachments: [],
                relatedRecords: {},
            };
        }

        setSender(senderId) {
            if (!senderId) {
                throw new Error('Sender requerido');
            }

            this.email.author = senderId;

            return this;
        }

        setSubject(subject = '') {
            const normalizedSubject = String(subject).trim();

            if (normalizedSubject.length > 300) {
                throw new Error('Subject demasiado largo');
            }

            this.email.subject = normalizedSubject;

            return this;
        }

        setBody(body = '') {
            this.email.body = String(body);

            return this;
        }

        addRecipient(recipients) {
            this.#addUniqueValues(this.email.recipients, recipients);

            return this;
        }

        addCc(ccRecipients) {
            this.#addUniqueValues(this.email.cc, ccRecipients);

            return this;
        }

        addBcc(bccRecipients) {
            this.#addUniqueValues(this.email.bcc, bccRecipients);

            return this;
        }

        addAttachment(fileObj) {
            if (!fileObj) {
                return this;
            }

            this.email.attachments.push(fileObj);

            return this;
        }

        addAttachments(files = []) {
            if (!Array.isArray(files)) {
                throw new TypeError('Attachments debe ser un array');
            }

            files.filter(Boolean).forEach((file) => this.addAttachment(file));

            return this;
        }

        relateToTransaction(transactionId) {
            if (!transactionId) {
                return this;
            }

            this.email.relatedRecords.transactionId = transactionId;

            return this;
        }

        relateToEntity(entityId) {
            if (!entityId) {
                return this;
            }

            this.email.relatedRecords.entityId = entityId;

            return this;
        }

        relateToActivity(activityId) {
            if (!activityId) {
                return this;
            }

            this.email.relatedRecords.activityId = activityId;

            return this;
        }

        relateToCustomRecord(recordType, id) {
            if (!recordType || !id) {
                throw new Error('CustomRecord requiere recordType e id');
            }

            this.email.relatedRecords.customRecord = {
                recordType,
                id,
            };

            return this;
        }

        validate() {
            if (!this.email.author) {
                throw new Error('Sender requerido');
            }

            if (!this.email.recipients.size) {
                throw new Error('Debe existir al menos un destinatario');
            }

            if (!this.email.subject) {
                throw new Error('Subject requerido');
            }

            if (typeof this.email.body !== 'string') {
                throw new TypeError('Body debe ser string');
            }

            if (!Array.isArray(this.email.attachments)) {
                throw new TypeError('Attachments debe ser array');
            }
        }

        build() {
            this.validate();

            return Object.freeze({
                author: this.email.author,

                recipients: Object.freeze([...this.email.recipients]),

                cc: Object.freeze([...this.email.cc]),

                bcc: Object.freeze([...this.email.bcc]),

                subject: this.email.subject,

                body: this.email.body,

                attachments: Object.freeze([...this.email.attachments]),

                relatedRecords: Object.freeze({
                    ...this.email.relatedRecords,
                }),
            });
        }

        #normalizeToArray(value) {
            if (value === null || value === undefined) {
                return [];
            }

            return Array.isArray(value) ? value.filter(Boolean) : [value];
        }

        #addUniqueValues(set, values) {
            this.#normalizeToArray(values).forEach((value) => {
                set.add(value);
            });
        }
    }

    return EmailBuilder;
});
