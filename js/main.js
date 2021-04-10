// Initialization
$(async function () {
    fetch_servers();
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
    $('#join-server')
        .on('click', function () {
            $('.add-server-main')
                .css({
                    'left': '-100%',
                });
            $('.join-server-main')
                .css({
                    'left': '0'
                });
        });
    $('.create-server-button')
        .on('click', function () {
            const name = $(this).siblings('.create-server-input').text();
            if (name !== '') {
                insert_server(next_id(), name);
            }
        });
    $('.join-server-button')
        .on('click', function () {
            const id = $(this).siblings('.join-server-input').text();
            if (id !== '') {
                $.ajax({
                    url: 'php/insert.php',
                    type: 'POST',
                    data: {
                        kind: 'join',
                        id: id
                    },
                    cache: false,
                    success: (response) => {
                        switch (response) {
                            case 'not_found': {
                                $('#join-error')
                                    .css({
                                        'width': '100%',
                                    })
                                    .text('This ID does not exist');
                            } break;

                            case 'already_joined': {
                                $('#join-error')
                                    .css({
                                        'width': '100%',
                                    })
                                    .text('You already are in this server');
                            } break;

                            default: {
                                make_server(response, id);
                                $('#join-error').text('');
                                close_add_server();
                            } break;
                        }
                    }
                });
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
                $('.settings-sidebar-button').removeClass('active');
                current.addClass('active');
                $('.settings-content').removeClass('basic-visible');
                $(`.settings-content div[tabindex="${index}"]`).addClass('basic-visible');
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
            $('<input type="file">')
                .trigger('click')
                .on('change', async function (event) {
                    insert_avatar(await fetch('id'), event.target.files[0]);
                });
        });
    $('.basic-app-container')
        .on('mousedown', function () {
            $('.server-context-menu').css({
                'top': 0,
                'left': 0,
                'z-index': -1
            });
        });
    gateway(); // Initializes websocket connection.
});

function make_server(name, id) {
    $('.basic-server-list')
        .append(
            `<div class="basic-server-instance" aria-label>
                <div class="pill"></div>
            </div>`)
        .children('.basic-server-instance')
        .last()
        .on({
            mouseover: function (event) {
                if (event.target !== $(this).children('.arrow')) {
                    const tooltip = $(`<div class="basic-server-tooltip">${name}</div>`);
                    const position = $(this).position();
                    const height = $(this).height();
                    $(this).append(tooltip);
                    $('.basic-server-tooltip')
                        .css({
                            top: position.top + ((height - tooltip.outerHeight()) / 2)
                        });
                }
            },
            mouseleave: function () {
                $(this)
                    .children('.basic-server-tooltip')
                    .remove();
            },
            contextmenu: function (event) {
                event.preventDefault();
                const menu = $('.server-context-menu');
                let height = event.pageY;
                if (event.pageY + menu.outerHeight() > $(window).height()) {
                    height -= menu.outerHeight();
                }
                menu.css({
                    'top': height,
                    'left': event.pageX,
                    'z-index': 2,
                });
                menu.children('#id')
                    .one('click', () => {
                        let clipboard = $('<input>');
                        $('#hidden-data').append(clipboard);
                        clipboard
                            .val(id)
                            .trigger('select');
                        document.execCommand("copy");
                        menu.css({
                            'top': 0,
                            'left': 0,
                            'z-index': -1
                        });
                        clipboard.remove();
                    })
                menu.children('#leave')
                    .one('click', () => {
                        menu.css({
                            'top': 0,
                            'left': 0,
                            'z-index': -1
                        });
                        // FixMe: Sometimes it removes the whole server sidebar lol.
                        if ($(this).attr('aria-label') === 'selected') {
                            $('.basic-sidebar-header .basic-text').text('');
                            const next = [$(this).prev(), $(this).next()].filter((each) => each !== undefined)[0];
                            if (next.length === 0) {
                                $('.basic-sidebar-scroller').html('');
                                $('.basic-master-container')
                                    .html(`
                                        <div class="basic-default-container">
                                            <img draggable="false" src="assets/icons/logo.png" alt>
                                        </div>`);
                            } else {
                                next.trigger('click');
                            }
                        }
                        leave_server(id);
                        $(this).remove();
                    });
            },
            click: async function () {
                if ($('div.basic-server-instance[aria-label="selected"]')[0] !== $(this)[0]) {
                    $('.basic-server-instance')
                        .attr({
                            'style': '',
                            'aria-label': ''
                        })
                        .children('.pill')
                        .attr('style', '');
                    $(this)
                        .attr('aria-label', 'selected')
                        .css({
                            'border-radius': '33%'
                        })
                        .children('.pill')
                        .css({
                            'height': '36px'
                        });
                    let channels = '';
                    for (const channel of JSON.parse(await fetch_channels(id))) {
                        channels += `
                            <div class="basic-channel-instance" aria-label>
                                <img draggable="false" src="assets/icons/hash.png" alt>
                                <div class="basic-text" id="${channel['id']}">${channel['name']}</div>
                            </div>`;
                    }
                    $('.basic-sidebar-channels')
                        .children()
                        .html(channels)
                        .children()
                        .on('click', async function () {
                            const current = $(this);
                            if ($('div.basic-channel-instance[aria-label="selected"]')[0] !== current[0]) {
                                $('.basic-channel-instance')
                                    .css({'background': 'transparent'})
                                    .attr('aria-label', '');
                                current
                                    .css({
                                        'color': 'rgb(209, 221, 212)',
                                        'background': 'rgb(52, 55, 60)'
                                    })
                                    .attr('aria-label', 'selected');
                                $('.basic-master-container')
                                    .html(`
                                        <div class="basic-message-scroller">
                                            <div>
                                                <div class="basic-message-wrapper"></div>
                                            </div>
                                        </div>
                                        <div class="basic-message-sender">
                                            <div class="basic-textbox-wrapper" id="textbox-wrapper">
                                                <div class="basic-message-textbox" id="message-textbox" placeholder="Message #${current.children('.basic-text').text()}" role="textbox" contenteditable></div>
                                            </div>
                                        </div>`);
                                fetch_messages(current.children('.basic-text').attr('id'));
                                $('#message-textbox')
                                    .on('keydown', async function (event) {
                                        if (event.key === 'Enter' && !event.shiftKey) {
                                            event.preventDefault();
                                            const content = $(this).text().trim();
                                            if (content !== '') {
                                                const data = {
                                                    op: 0,
                                                    type: 'message_create',
                                                    payload: {
                                                        id: `${await fetch('id')}`,
                                                        author: `${await fetch('username')}`,
                                                        guild: `${id}`,
                                                        channel: `${
                                                            current
                                                                .children('.basic-text')
                                                                .attr('id')}`,
                                                        message: {
                                                            id: `${next_id()}`,
                                                            content: `${content}`
                                                        }
                                                    }
                                                };
                                                await dispatch_event(data);
                                                $.ajax({
                                                    url: 'php/insert.php',
                                                    type: 'POST',
                                                    data: {
                                                        kind: 'message',
                                                        message: JSON.stringify(data['payload'])
                                                    },
                                                    cache: false,
                                                    success: (_) => {} // TODO: Error Handling (?).
                                                });
                                                $(this).html('');
                                            }
                                        }
                                    })
                                    .on('paste', function (event) {
                                        event.preventDefault();
                                        const clipboard = event.originalEvent.clipboardData;
                                        document.execCommand('inserttext',  false,  clipboard.getData('text/plain'));
                                    });
                                await dispatch_event({
                                    op: 0,
                                    type: 'transition_channel',
                                    payload: {
                                        channel: `${
                                            current
                                                .children('.basic-text')
                                                .attr('id')}`
                                    }
                                });
                            }
                        })
                        .first()
                        .trigger('click');
                    $('.basic-sidebar-header .basic-text').text(name);
                }
            }
        });
}

async function fetch_channels(id) {
    let result = '';
    await $.ajax({
        url: 'php/fetch.php',
        type: 'POST',
        data: {
            kind: 'channels',
            id: id
        },
        cache: false,
        success: (response) => {
            switch (response) {
                default: { // TODO: Error handling.
                    result = response;
                } break;
            }
        }
    });
    return result;
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
                        make_server(server['name'], server['id']);
                    }
                } break;
            }
        }
    });
}

function fetch_messages(channel) {
    $.ajax({
        url: 'php/messages.php',
        type: 'POST',
        data: {
            channel: channel
        },
        cache: false,
        success: async (response) => {
            switch (response) {
                default: {
                    for (const message of JSON.parse(response)) {
                        await insert_message({
                            id: message['author'],
                            author: await fetch_author(message['author']),
                            guild: `${message['guild']}`,
                            channel: `${message['channel']}`,
                            message: {
                                id: message['id'],
                                content: message['content']
                            }
                        });
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
    $('.join-server-input[contenteditable]')
        .html('');
    $('.join-server-main')
        .css({
            'left': '100%'
        });
    $('#join-error')
        .attr('style', '')
        .text('');
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
                    make_server(name, id);
                } break;
            }
        }
    });
}

function leave_server(id) {
    $.ajax({
        url: 'php/delete.php',
        type: 'POST',
        data: {
            kind: 'guild',
            id: id,
        },
        cache: false,
        success: (response) => {
            switch (response) {
                case 'query_error': {
                    console.log(response);
                } break;
            }
        }
    });
}

async function insert_message(payload) {
    const author  = payload['author'];
    const content = $("<div>").text(payload['message']['content']).html();
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
    gateway().send(data);
    switch (payload['type']) {
        case 'message_create': {
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

const fetch = (function () {
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
    const open =
        (_) => {
            tries = 0;
            console.log('[Info]: connection successful');
            heartbeat = setTimeout(async function keep_alive() {
                await dispatch_event({
                    op: 1,
                    type: 'heartbeat'
                });
                heartbeat = setTimeout(keep_alive, 60000);
            }, 60000);
        };
    const message =
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
    const close =
        () => {
            if (tries++ > 5) {
                console.error('[Error]: cannot connect to the websocket server');
            } else {
                console.log('[Info]: connection terminated');
                wss = new WebSocket('wss://gateway.alex8675.eu:2096');
                clearTimeout(heartbeat);
                wss.onopen = async () => {
                    const channel = $('div.basic-channel-instance[aria-label="selected"]');
                    if (channel.length !== 0) {
                        await dispatch_event({
                            op: 0,
                            type: 'transition_channel',
                            payload: {
                                channel: `${
                                    channel
                                        .children('.basic-text')
                                        .attr('id')}`
                            }
                        });
                    }
                    open();
                };
                wss.onmessage = message;
                wss.onclose = close;
            }
        };
    return function () {
        if (wss === null) {
            wss = new WebSocket('wss://gateway.alex8675.eu:2096');
            wss.onopen = () => {
                $('.basic-loader').fadeOut(500);
                open();
            };
            wss.onmessage = message;
            wss.onclose = close;
        }
        return wss;
    }
})();

const fetch_author = (function () {
    let cached = {};
    return async function (id) {
        if (cached[id] === undefined) {
            await $.ajax({
                url: 'php/fetch.php',
                type: 'POST',
                data: {
                    kind: 'author',
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
    };
})();

const fetch_avatar = (function () {
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