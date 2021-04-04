// Initialization
$(async function () {
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
    $('.basic-username div').html(await fetch('username'));
    $('#user-settings')
        .on('click', function () {
            toggle_settings();
        });
    $('#add-server')
        .on('click', function () {
            $('.add-server-container')
                .css({
                    'background': 'rgba(0, 0, 0, 0.6)',
                    'z-index': '2'
                });
            $('.add-server-wrapper')
                .css({
                    'height': '300px'
                });
        });
    $('#create-server')
        .on('click', function () {
            $('.add-server-main')
                .css({
                    'left': '-100%',
                });
            $('.create-server-main')
                .css({
                    'left': '0'
                });
        });
    $('#make-server')
        .on('click', function () {
            const name = $(this).siblings('.create-server-input').text();
            if (name !== '') {
                insert_server(next_id(), name);
            }
        });
    $('.add-server-wrapper .close')
        .on('click', function () {
            close_add_server();
        });
    $('.add-server-container')
        .on('mousedown', function (event) {
            if (event.target === this) {
                close_add_server();
            }
        });
    const avatar = await fetch_avatar(await fetch('id'));
    if (avatar !== '') {
        $('.basic-user-icon img').attr('src', avatar);
        $('.account-avatar img').attr('src', avatar);
    }
    $('.settings-close-button')
        .on('click', function () {
            toggle_settings();
        });
    $('.settings-sidebar-button')
        .each(function (index) {
            const current = $(this);
            current.on('click', function () {
                $('.settings-sidebar-button')
                    .each(function () {
                        $(this).removeClass('active');
                    });
                current.addClass('active');
                $('.settings-content')
                    .each(function () {
                        $(this).removeClass('basic-visible');
                    });
                $(`.settings-content[tabindex="${index}"]`)
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
                    window.location.replace('index');
                }
            });
        });
    $('[contenteditable]')
        .on('paste', function (event) {
            event.preventDefault();
            const clipboard = event.originalEvent.clipboardData;
            document.execCommand('inserttext',  false,  clipboard.getData('text/plain'));
        });
    $('.account-details #username').text(await fetch('username'));
    $('.account-details #email').text(await fetch('email'));
    $('.account-avatar-change')
        .on('click', function () {
            $(document.createElement('input'))
                .attr('type', 'file')
                .trigger('click')
                .on('change', async function (event) {
                    insert_avatar(await fetch('id'), event.target.files[0]);
                });
        });
    fetch_servers();
    gateway(); // Initializes websocket connection.
});

function make_server(name) {
    $('.basic-server-list')
        .append(`<div class="basic-server-instance"></div>`)
        .children('.basic-server-instance')
        .last()
        .on('mouseover', function () {
            const position = $(this).position();
            $(this).html(`<div class="basic-server-tooltip">${name}</div>`);
            $('.basic-server-tooltip')
                .css({
                    top: position.top + 8,
                });
        })
        .on('mouseleave', function () {
            $(this).html('');
        });
}

function fetch_servers() {
    $.ajax({
        url: 'php/fetch.php',
        type: 'POST',
        data: {
            kind: 'guild'
        },
        cache: false,
        success: (response) => {
            switch (response) {
                default: {
                    for (const server of JSON.parse(response)) {
                        make_server(server['name']);
                    }
                } break;
            }
        }
    });
}

function toggle_settings() {
    $('.settings-container').toggleClass('basic-visible');
    $('.basic-app-container').toggleClass('basic-hidden');
}

function close_add_server() {
    $('.add-server-wrapper')
        .css({
            'height': '0'
        });
    $('.create-server-input[contenteditable]')
        .html('');
    $('.create-server-main')
        .css({
            'left': '100%'
        });
    $('.add-server-main')
        .css({
            'left': '0'
        });
    $('.add-server-container')
        .css({
            'background': 'rgba(0, 0, 0, 0.0)'
        })
        .delay(300)
        .queue(function () {
            $(this)
                .css({ 'z-index': '-1' })
                .dequeue();
        });
}

function insert_server(id, name) {
    $.ajax({
        url: 'php/insert.php',
        type: 'POST',
        data: { // TODO: Handle Guild Avatars.
            kind: 'guild',
            name: name,
            id: id,
        },
        cache: false,
        success: (response) => {
            switch (response) {
                default: {
                    close_add_server($('.add-server-container'));
                    make_server(name);
                } break;
            }
        }
    });
}

async function insert_message(payload) {
    const author  = payload['author'];
    const content = $("<div>").text(payload['content']).html();
    const grouped = $('.basic-message-username').last().text() === author;

    let html;
    if (!grouped) {
        const avatar = await fetch_avatar(payload['id']);
        const path   = avatar === '' ? 'assets/icons/blank.png' : avatar;
        html = `
            <div class="basic-message-group basic-group-start">
                <div class="basic-chat-message">
                    <div class="basic-message-avatar">
                        <img src="${path}" alt/>
                    </div>
                    <div class="basic-message-text">
                        <div class="basic-message-username">${author}</div>
                        <div class="basic-message-content">${content}</div>
                    </div>
                </div>
            </div>`;
    } else {
        html = `
            <div class="basic-message-group">
                <div class="basic-chat-message">
                    <div class="basic-message-content">${content}</div> 
                </div>
            </div>`;
    }
    $('div[class="basic-message-wrapper"]').append(html);
}

async function dispatch_event(payload) {
    const data = JSON.stringify(payload);
    console.log('[Info] dispatch_event:', data);
    switch (payload['type']) {
        case 'message_create': {
            try {
                gateway().send(data);
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
    $.ajax({
        url: 'php/insert.php',
        type: 'POST',
        data: data,
        processData: false,
        contentType: false,
        cache: false,
        success: async (response) => {
            switch (response) {
                default: {
                    let updated = await fetch_avatar(await fetch('id'));
                    $('.basic-user-icon img').attr('src', updated);
                    $('.account-avatar img').attr('src', updated);
                } break;

                case 'unsupported_format': {
                    alert('There was an error uploading your image');
                } break;
            }
        }
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
                            window.location.replace('login');
                        } break;
                    }
                }
            });
        }
        return cached[kind];
    };
})();

let gateway = (function () {
    let wss = null;
    let heartbeat = null;
    let tries = 0;
    let open =
        (_) => {
            tries = 0;
            console.log('[Info]: connection successful');
            heartbeat = setTimeout(function keep_alive() {
                wss.send(JSON.stringify({
                    op: 0,
                    type: 'heartbeat'
                }));
                console.log('[Info]: sent heartbeat');
                heartbeat = setTimeout(keep_alive, 60000);
            }, 60000);
        };
    let message =
        async (payload) => {
            const data = JSON.parse(payload.data);
            switch (data['type']) {
                case 'message_create': {
                    console.log('[Info]: received message: ', data);
                    await insert_message(data['payload']);
                } break;

                case 'heartbeat': {
                    // TODO: Something useful lol.
                } break;
            }
        };
    let close =
        () => {
            if (tries++ > 5) {
                console.error('[Error]: cannot connect to the websocket server');
            } else {
                console.log('[Info]: connection terminated');
                wss = new WebSocket('wss://gateway.alex8675.eu:2096');
                clearTimeout(heartbeat);
                wss.onopen = open;
                wss.onmessage = message;
                wss.onclose = close;
            }
        };
    return function () {
        if (wss === null) {
            wss = new WebSocket('wss://gateway.alex8675.eu:2096');
            wss.onopen = open;
            wss.onmessage = message;
            wss.onclose = close;
        }
        return wss;
    }
})();

let fetch_avatar = (function () {
    let cached = {};
    return async function (id) {
        if (cached[id] === undefined) {
            cached[id] = String();
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