define(['N/ui/dialog'], function (dialog) {
    class Dialog {
        static confirm({ title, message }) {
            return dialog.confirm({
                title: title,
                message: message,
            });
        }

        static reject({ title, label }) {
            window.rejectReason = '';
            let { promise, resolve, reject } = Promise.withResolvers();

            const labelText = label || 'reason';
            const html = `
            <div style="padding:10px;">
                <style type="text/css">
                    #reason {
                        width: 100%;
                        resize: none;
                        border: 1px solid #ccc;
                        padding: 5px;

                        &:focus {
                            outline: none;
                            border-color: #007cc0;
                        }
                    }
                </style>
                <label for="reason" style="margin-bottom:6px; display: block">${labelText}:</label><br>
                <textarea id="reason" rows="4" cols="40" style="width:100%;" oninput="window.rejectReason = this.value"></textarea>
            </div>
        `;

            const rejectDialog = dialog.create({
                title: title,
                message: html,
                buttons: [
                    {
                        label: 'Reject',
                        value: 'ok',
                    },
                    {
                        label: 'Cancel',
                        value: 'cancel',
                    },
                ],
            });

            rejectDialog
                .then((result) => {
                    if (result === 'ok') {
                        if (window.rejectReason?.trim() === '') {
                            alert('please enter a reason');
                        }
                        resolve(window.rejectReason);
                    } else {
                        resolve(null);
                    }
                })
                .catch((error) => {
                    reject(error);
                });

            return promise;
        }
    }

    return Dialog;
});
