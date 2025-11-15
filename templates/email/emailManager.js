define(['N/file', 'N/render', 'N/email'], function (file, render, email) {
    const EMAIL_TEMPLATES = {
        exampleEmail: './template/example.html',
    };

    class EmailManager {
        constructor() {}

        sendExampleEmail({ data, recipient, author }) {
            const template = this.#loadTemplate(EMAIL_TEMPLATES.exampleEmail);
            const body = this.#fillTemplate(template, data);
            this.#sendEmail({
                recipient,
                body,
                subject: `Example email`,
                author,
            });
        }

        #loadTemplate(templateName) {
            return file.load({ id: templateName });
        }

        #fillTemplate(template, data) {
            const renderer = render.create();
            renderer.templateContent = template.getContents();

            renderer.addCustomDataSource({
                format: render.DataSource.OBJECT,
                alias: 'data',
                data: data,
            });

            return renderer.renderAsString();
        }

        #sendEmail({ recipient, body, subject, author }) {
            email.send({
                author: author,
                recipients: recipient,
                subject: subject,
                body: body,
            });
        }
    }

    return EmailManager;
});
