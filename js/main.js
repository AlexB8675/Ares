// Initialization
$(async function () {
    $('#message-textbox')
        .on('keydown', function (event) {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
            }
        });
    $('.basic-hamburger-wrapper')
        .on('click', function () {
            $('#hamburger').toggleClass('open');
            $('#app-sidebar').toggleClass('open');
        });
    $('div[class="basic-username"]').html(await retrieve_username());
    $('div[class="basic-settings-icon"]')
        .on('click', function () {
            $('.basic-app-container')
                .css({
                    'z-index': '-1',
                    'opacity': '0',
                });
            $('.basic-settings-container')
                .css({
                    'z-index': '0',
                    'opacity': '1',
                });
        });
    $('div[class="basic-close-button"]')
        .on('click', function () {
            $('.basic-app-container')
                .css({
                    'z-index': '-1',
                    'opacity': '0',
                });
            $('.basic-settings-container')
                .css({
                    'z-index': '0',
                    'opacity': '1',
                });
        });
});

let retrieve_username = (function () {
    let username = '';
    return async function () {
        if (username === '') {
            await $.ajax({
                url: 'php/retrieve.php',
                type: 'POST',
                data: {
                    kind: 'username'
                },
                cache: false,
                success: (response) => {
                    switch (response) { // TODO: Error handling.
                        default: {
                            username = response;
                        } break;

                        case 'unknown_session': {
                            console.log('not logged in.');
                        } break;
                    }
                }
            });
        }
        return username;
    };
})();