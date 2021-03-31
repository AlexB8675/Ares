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
    $('.basic-hamburger-wrapper')
        .on('click', function () {
            $('#hamburger').toggleClass('open');
            $('#app-sidebar').toggleClass('open');
        });
    $('.basic-username').html(await fetch('username'));
    $('#user-settings')
        .on('click', function () {
            toggle_settings();
        });
    $('#add-server')
        .on('click', function (event) {
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
    const avatar = await avatar_from_id(await fetch('id'));
    if (avatar !== '') {
        let updated = `${avatar}?id=${next_id()}`;
        $('.basic-user-icon img').attr('src', updated);
        $('.account-avatar img').attr('src', updated);
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
    websocket(); // Initializes websocket connection.
});

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
                } break;
            }
        }
    });
}

async function insert_message(payload) {
    const author  = payload['author'];
    const content = $("<div>").text(payload['content']).html();
    const avatar  = await avatar_from_id(payload['id']);
    const path    = avatar === '' ? 'assets/icons/blank.png' : `${avatar}?id=${next_id()}`;
    const grouped = $('.basic-message-username').last().text() === author;

    let html;
    if (!grouped) {
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
    console.log('[Info] dispatch_event: ', data);
    switch (payload['type']) {
        case 'message_create': {
            try {
                websocket().send(data);
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
                    let updated = `${await avatar_from_id(await fetch('id'))}?id=${next_id()}`;
                    $('.basic-message-avatar img').attr('src', updated);
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

let websocket = (function () {
    let wss = null;
    return function () {
        if (wss === null) {
            wss = new WebSocket('wss://gateway.alex8675.eu:2096');
            wss.onerror = function (error) {
                console.error(error);
            }
            wss.onopen = function (_) {
                console.log('[Info]: connection successful');
                setInterval(() => {
                    wss.send(JSON.stringify({
                        op: 0,
                        type: 'heartbeat'
                    }));
                    console.log('[Info]: sent heartbeat');
                }, 60000);
            };
            wss.onmessage = async function (payload) {
                const data = JSON.parse(payload.data);
                console.log('[Info]: received message: ', data);
                switch (data['type']) {
                    case 'message_create': {
                        await insert_message(data['payload']);
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
