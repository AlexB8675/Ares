// Initialization
$(function () {
    fetch_servers();
    fetch('username', (username) => {
        $('.basic-username div').html(username);
    });
    fetch('id', (id) => {
        fetch_avatar(id, (avatar) => {
            if (avatar !== '') {
                $('.basic-user-icon img').attr('src', avatar);
                $('.account-avatar img').attr('src', avatar);
            }
        });
    });
    fetch('username', (username) => {
        $('.account-details #username').text(username);
    });
    fetch('email', (email) => {
        $('.account-details #email').text(email);
    });
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
    $('.account-avatar-change')
        .on('click', function () {
            $('<input type="file">')
                .trigger('click')
                .on('change', function (event) {
                    fetch('id', (id) => {
                        insert_avatar(id, event.target.files[0]);
                    });
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
            click: function () {
                if ($('div.basic-server-instance[aria-label="selected"]')[0] !== $(this)[0]) {
                    $('.basic-loader').show();
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
                    $.ajax({
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
                                    for (const channel of JSON.parse(response)) {
                                        channels += `
                                            <div class="basic-channel-instance" aria-label>
                                                <img draggable="false" src="assets/icons/hash.png" alt>
                                                <div class="basic-text" id="${channel['id']}">${channel['name']}</div>
                                            </div>`;
                                        $('.basic-sidebar-channels')
                                            .children()
                                            .html(channels)
                                            .children()
                                            .on('click', function () {
                                                const current = $(this);
                                                if ($('div.basic-channel-instance[aria-label="selected"]')[0] !== current[0]) {
                                                    const name    = current.children('.basic-text').text();
                                                    const channel = current.children('.basic-text').attr('id');
                                                    $('.basic-loader').show();
                                                    dispatch_event({
                                                        op: 0,
                                                        type: 'transition_channel',
                                                        payload: {
                                                            channel: channel
                                                        }
                                                    });
                                                    fetch_messages(channel);
                                                    $('.basic-channel-instance')
                                                        .css({'background': 'transparent'})
                                                        .attr('aria-label', '');
                                                    current
                                                        .css({
                                                            'color': 'rgb(209, 210, 221)',
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
                                                                <div class="basic-textbox-wrapper">
                                                                    <div class="basic-message-textbox" placeholder="Message #${name}" role="textbox" contenteditable></div>
                                                                </div>
                                                            </div>`);
                                                    $('.basic-message-textbox')
                                                        .on('keydown', function (event) {
                                                            if (event.key === 'Enter' && !event.shiftKey) {
                                                                event.preventDefault();
                                                                const content = $(this).text().trim();
                                                                if (content !== '') {
                                                                    fetch('id', (user_id) => {
                                                                        fetch('username', (username) => {
                                                                            const data = {
                                                                                op: 0,
                                                                                type: 'message_create',
                                                                                payload: {
                                                                                    id: user_id,
                                                                                    author: username,
                                                                                    guild: id,
                                                                                    channel: channel,
                                                                                    message: {
                                                                                        id: next_id(),
                                                                                        content: content
                                                                                    }
                                                                                }
                                                                            };
                                                                            dispatch_event(data);
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
                                                                        });
                                                                    });
                                                                }
                                                            }
                                                        })
                                                        .on('paste', function (event) {
                                                            event.preventDefault();
                                                            const clipboard = event.originalEvent.clipboardData;
                                                            document.execCommand('inserttext',  false,  clipboard.getData('text/plain'));
                                                        });
                                                }
                                            })
                                            .first()
                                            .trigger('click');
                                        $('.basic-sidebar-header .basic-text').text(name);
                                    }
                                } break;
                            }
                        }
                    });
                }
            }
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
                            author: message['username'],
                            guild: message['guild'],
                            channel: message['channel'],
                            message: {
                                id: message['id'],
                                content: message['content']
                            }
                        }, message['avatar']);
                    }
                    $('.basic-loader').fadeOut(500);
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

async function insert_message(payload, avatar) {
    const author  = payload['author'];
    const content = $("<div>").text(payload['message']['content']).html();
    const grouped = $('.basic-message-username').last().text() === author;

    let html;
    if (!grouped) {
        const insert = (avatar) => {
            const path = avatar === '' || avatar === null ? 'assets/icons/blank.png' : avatar;
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
        }
        if (avatar === undefined) {
            fetch_avatar(payload['id'], (avatar) => {
                const path = avatar === '' || avatar === null ? 'assets/icons/blank.png' : avatar;
                insert(path);
            });
        } else {
            const path = avatar === '' || avatar === null ? 'assets/icons/blank.png' : avatar;
            insert(path);
        }
    } else {
        html = `
            <div class="basic-message-group">
                <div class="basic-chat-message">
                    <div class="basic-message-content">${content}</div> 
                </div>
            </div>`;
    }
    $('div.basic-message-wrapper').append(html);
}

function dispatch_event(payload) {
    gateway().send(JSON.stringify(payload));
    console.log('[Info] dispatch_event:', payload);
    switch (payload['type']) {
        case 'message_create': {
            insert_message(payload['payload']).catch(console.error);
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
        success: (response) => {
            switch (response) {
                default: {
                    fetch('id', (id) => {
                        fetch_avatar(id, (avatar) => {
                            $('.basic-user-icon img').attr('src', avatar);
                            $('.account-avatar img').attr('src', avatar);
                        });
                    });

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
    return function (kind, callback) {
        if (!Object.keys(cached).includes(kind)) {
            $.ajax({
                url: 'php/fetch.php',
                type: 'POST',
                data: {
                    kind: kind
                },
                cache: false,
                success: (response) => {
                    switch (response) {
                        default: {
                            callback(cached[kind] = response);
                        } break;

                        case 'unknown_session': {
                            console.log('[Error] not logged in.');
                            window.location.replace('login');
                        } break;
                    }
                }
            });
        } else {
            callback(cached[kind]);
        }
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
            heartbeat = setTimeout(function keep_alive() {
                dispatch_event({
                    op: 1,
                    type: 'heartbeat'
                });
                heartbeat = setTimeout(keep_alive, 60000);
            }, 60000);
        };
    const message =
        (payload) => {
            const data = JSON.parse(payload.data);
            switch (data['type']) {
                case 'message_create': {
                    console.log('[Info]: received message: ', data);
                    insert_message(data['payload']).catch(console.error);
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
                wss.onopen = () => {
                    const channel = $('div.basic-channel-instance[aria-label="selected"]');
                    if (channel.length !== 0) {
                        dispatch_event({
                            op: 0,
                            type: 'transition_channel',
                            payload: {
                                channel:
                                    channel
                                        .children('.basic-text')
                                        .attr('id')
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

const fetch_avatar = (function () {
    let cached = {};
    return function (id, callback) {
        if (cached[id] === undefined) {
            cached[id] = String();
        }
        const has_author = !Object.keys(cached).includes(id);
        const is_default = cached[id] === '';
        if (!has_author && is_default) {
            $.ajax({
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
                            callback(cached[id] = response);
                        } break;
                    }
                }
            });
        } else {
            callback(cached[id]);
        }
    }
})();