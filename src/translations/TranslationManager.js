define(['N/runtime'], function (runtime) {
    class TranslationManager {
        constructor({ customTranslation } = {}) {
            const user = runtime.getCurrentUser();
            const localeUser = this.#getLocale(user.getPreference('LANGUAGE'));
            this.language = localeUser;
            this.translation = customTranslation;
        }
        /**
         *
         * @param {*} key  Translation key
         * @param {*} params  Key-value pairs for placeholder replacements.
         * @returns Translated text, or the key itself if not found.
         */
        get(key, params = {}) {
            let text = this.translation?.[key]?.[this.language] || this.translation?.[key]?.en || key;

            for (let [key, value] of Object.entries(params)) {
                text = text.replaceAll(`{${key}}`, value);
            }

            return text;
        }

        /**
         *
         * @param {*} language  Full NetSuite language code.
         * @returns {string} Simplified locale code ('es', 'en', 'pt').
         */
        #getLocale(language) {
            const validLanguages = ['es', 'en', 'pt'];
            const currentLocale = language.substr(0, 2);

            if (validLanguages.includes(currentLocale)) {
                return currentLocale;
            }
            return 'en';
        }
    }

    return TranslationManager;
});
