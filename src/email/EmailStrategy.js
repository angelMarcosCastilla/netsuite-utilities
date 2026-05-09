/**
 * @NApiVersion 2.1
 * @NModuleScope SameAccount
 */
define(['N/email', './emailBuilder.js'], (email, EmailBuilder) => {
    class EmailStrategy {
        send() {
            throw new Error('Metodo send() debe ser implementado');
        }
    }

    class NetSuiteEmailStrategy extends EmailStrategy {
        send(data) {
            const dataEmail = new EmailBuilder()
                .setAuthor(data.author)
                .setRecipients(data.recipients)
                .setCc(data.cc)
                .setBcc(data.bcc)
                .build();

            email.send(dataEmail);
        }
    }

    class EmailStrategyFactory {
        static strategies = {
            netsuite: new NetSuiteEmailStrategy(),
        };

        static get(strategyKey) {
            const strategy = this.strategies[strategyKey];

            if (!strategy) {
                throw new Error(`Strategy no encontrada: ${strategyKey}`);
            }

            return strategy;
        }
    }

    return {
        EmailStrategyFactory,
    };
});
