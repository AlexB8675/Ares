// Initialization
$(async function () {
    $('#message-textbox')
        .on('keydown', async function (event) {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                const content = $(this).text().trim();
                if (content !== '') {
                    dispatch_event({
                        op: "1",
                        type: "message_create",
                        payload: {
                            author: `${await fetch_username()}`,
                            content: `${content}`
                        }
                    });
                    $(this).html('');
                }
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
            });
        });
    get_websocket(); // Initializes the websocket connection
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

function insert_message(payload, grouped) {
    const author  = payload['author'].replaceAll('"', '');
    const content = payload['content'].replaceAll('"', '');
    let html;
    if (!grouped) {
        html = `
            <div class="basic-message-group basic-group-start">
                <div class="basic-chat-message">
                    <div class="basic-message-avatar"></div>
                    <div class="basic-message-text">
                        <div class="basic-message-username">${author}</div>
                        <div class="basic-message-content">${content}</div>
                    </div>
                </div>
            </div>`;
    } else {
        html = `
            <div class="basic-message-group">
                <div class="basic-message-content">${content}</div>
            </div>`;
    }
    $('div[class="basic-message-wrapper"]').append(html);
}

function dispatch_event(payload) {
    switch (payload['type']) {
        case 'message_create': {
            get_websocket().send(JSON.stringify(payload));
            insert_message(payload['payload'], false);
        } break;
    }
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
                    switch (response) {
                        default: {
                            username = response;
                        } break;

                        case 'unknown_session': {
                            console.log('[Err] not logged in.');
                            window.location.replace('login.html');
                        } break;
                    }
                }
            });
        }
        return username;
    };
})();

let get_websocket = (function () {
    let wss = null;
    return function () {
        if (wss === null) {
            wss = new WebSocket('ws://93.41.228.90:9000');
            wss.onopen = (_) => {
                console.log('[Info]: connection successful');
            };
            wss.onmessage = async (payload) => {
                console.log(`[Info]: received message: ${payload.data}`);
                const event = JSON.parse(payload.data);
                insert_message(event['payload'], false);
            };
            wss.onclose = () => {
                wss = new WebSocket('ws://93.41.228.90:9000');
            }
        }
        return wss;
    }
})();
