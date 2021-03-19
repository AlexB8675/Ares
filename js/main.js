// Initialization
$(async function () {
    const avatar = await avatar_from_id(await fetch('id'));
    $('#message-textbox')
        .on('keydown', async function (event) {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                const content = $(this).text().trim();
                if (content !== '') {
                    await dispatch_event({
                        op: "1",
                        type: "message_create",
                        payload: {
                            id: `${await fetch('id')}`,
                            author: `${await fetch('username')}`,
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
    $('div[class="basic-username"]').html(await fetch('username'));
    $('div[class="basic-settings-icon"]:last-child')
        .on('click', function () {
            $('.basic-settings-container').toggleClass('basic-visible');
            $('.basic-app-container').toggleClass('basic-hidden');
        });
    $('div[class="basic-settings-container"]')
        .on('keydown', function (event) {
            if (event.key === 'Escape') {
                close_settings();
            }
        });
    if (avatar !== '') {
        $('div[class="basic-user-icon"]')
            .css('background', `url(${avatar}/avatar40.png)`);
        $('div[class="account-avatar"]')
            .css('background', `url(${avatar}/avatar80.png)`);
    }
    $('div[class="basic-settings-close-button"]')
        .on('click', () => {
            close_settings();
        });
    $('div[class="basic-settings-sidebar-button"]')
        .each(function (index) {
            const current = $(this);
            current.on('click', function () {
                $('div[class="basic-settings-sidebar-button"]')
                    .each(function () {
                        $(this).removeClass('basic-active');
                    });
                current.addClass('basic-active');
                $('div[class="basic-settings-content"]')
                    .each(function () {
                        $(this).removeClass('basic-visible');
                    });
                $(`div[class="basic-settings-content"][tabindex="${index}"]`)
                    .addClass('basic-visible');
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
    $('[contenteditable]')
        .on('paste', function (event) {
            event.preventDefault();
            const clipboard = event.originalEvent.clipboardData;
            document.execCommand('inserttext',  false,  clipboard.getData('text/plain'));
        });
    $('.account-details div[id="username"]').text(await fetch('username'));
    $('.account-details div[id="email"]').text(await fetch('email'));

    $('div[class="account-avatar-change"]')
        .on('click', function () {
            $(document.createElement('input'))
                .attr('type', 'file')
                .trigger('click')
                .on('change', async function (event) {
                    insert_avatar(await fetch('id'), event.target.files[0]);
                });
        });
    get_websocket(); // Initializes websocket connection.
});

function close_settings() {
    $('.basic-settings-container').toggleClass('basic-visible');
    $('.basic-app-container').toggleClass('basic-hidden');
}

async function insert_message(payload) {
    const author  = payload['author'];
    const content = $("<div>").text(payload['content']).html();
    const avatar  = await avatar_from_id(payload['id']);
    const path    = avatar === '' ? 'white' : `url(${avatar}/avatar40.png")`;
    const grouped = $('div[class="basic-message-username"]').last().text() === author;
    let html;
    if (!grouped) {
        html = `
            <div class="basic-message-group basic-group-start">
                <div class="basic-chat-message">
                    <div class="basic-message-avatar" style="background: ${path}"></div>
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

async function dispatch_event(payload) {
    const bytes = JSON.stringify(payload);
    console.log('dispatch_event: ', bytes);
    switch (payload['type']) {
        case 'message_create': {
            try {
                get_websocket().send(bytes);
            } catch (e) {
                console.log(e);
            }
            await insert_message(payload['payload']);
        } break;
    }
}

function insert_avatar(id, file) {
    let data = new FormData();
    data.append('kind', 'avatar');
    data.append('avatar', file);
    data.append('id', id);
    $.ajax({
        url: 'php/insert.php',
        type: 'POST',
        processData: false,
        contentType: false,
        dataType : 'json',
        data: data,
        cache: false,
        success: (_) => {} // TODO: Error handling.
    });
}

let fetch = (function () {
    let cached = {};
    return async function (kind) {
        if (!Object.keys(cached).includes(kind)) {
            await $.ajax({
                url: 'php/fetch.php',
                type: 'POST',
                data: {
                    kind: kind
                },
                cache: false,
                success: (response) => {
                    switch (response) {
                        default: {
                            cached[kind] = response;
                        } break;

                        case 'unknown_session': {
                            console.log('[Error] not logged in.');
                            window.location.replace('login.html');
                        } break;
                    }
                }
            });
        }
        return cached[kind];
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
                console.log('[Info]: received message: ', payload.data);
                const event = JSON.parse(payload.data);
                switch (event['type']) {
                    case 'message_create': {
                        await insert_message(event['payload']);
                    } break;
                }
            };
        }
        return wss;
    }
})();

let avatar_from_id = (function () {
    let cached = {};
    return async function (id) {
        if (cached[id] === undefined) {
            cached[id] = '';
        }
        const has_author = !Object.keys(cached).includes(id);
        const is_default = cached[id] === '';
        if (!has_author && is_default) {
            await $.ajax({
                url: 'php/fetch.php',
                type: 'POST',
                data: {
                    kind: 'avatar',
                    id: id,
                },
                cache: false,
                success: (response) => {
                    switch (response) { // TODO: Error handling.
                        default: {
                            cached[id] = response;
                        } break;
                    }
                }
            });
        }
        return cached[id];
    }
})();
