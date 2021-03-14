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
            $('.basic-settings-container')
                .css({
                    'visibility': 'visible',
                    'opacity': '1',
                });
            $('.basic-app-container')
                .css({
                    'visibility': 'hidden',
                    'opacity': '0',
                });
        });
    $('div[class="basic-settings-close-button"]')
        .on('click', function () {
            $('.basic-settings-container')
                .css({
                    'visibility': 'hidden',
                    'opacity': '0',
                });
            $('.basic-app-container')
                .css({
                    'visibility': 'visible',
                    'opacity': '1',
                });
        });
    $('#button-logout')
        .on('click', function () {
            $.ajax({
                url: 'php/logout.php',
                type: 'POST',
                data: {},
                cache: false,
                success: (_) => {
                    window.location.replace('index.html');
                }
            })
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
                            window.location.replace('login.html');
                        } break;
                    }
                }
            });
        }
        return username;
    };
})();