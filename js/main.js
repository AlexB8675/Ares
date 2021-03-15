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
    $('div[class="basic-username"]').html(await fetch_username());
    $('div[class="basic-settings-icon"]')
        .on('click', function () {
            $('.basic-settings-container')
                .css({
                    'z-index': '0',
                    'opacity': '1',
                })
                .focus();
            $('.basic-app-container')
                .css({
                    'z-index': '-1',
                    'opacity': '0',
                });
        });
    $('div[class="basic-settings-container"]')
        .on('keydown', function (event) {
            if (event.key === 'Escape') {
                close_settings();
            }
        });
    $('div[class="basic-settings-close-button"]')
        .on('click', () => {
            close_settings();
        });
    $('div.basic-settings-sidebar-button').each(function () {
        const current = $(this);
        current.on('click', function () {
            $('div.basic-settings-sidebar-button')
                .each(function () {
                    if (current !== $(this)) {
                        $(this).removeClass('basic-active');
                    }
                });
            $(this).addClass('basic-active');
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

function close_settings() {
    $('.basic-settings-container')
        .css({
            'z-index': '-1',
            'opacity': '0',
        });
    $('.basic-app-container')
        .css({
            'z-index': '0',
            'opacity': '1',
        })
        .focus();
}

let fetch_username = (function () {
    let username = '';
    return async function () {
        if (username === '') {
            await $.ajax({
                url: 'php/fetch.php',
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