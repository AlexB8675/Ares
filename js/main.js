// Initialization
$(function () {
    fetch_servers();
    fetch_avatar('0', false, true,(avatar) => {
        if (avatar !== null) {
            $('.basic-user-icon img').attr('src', avatar);
            $('.account-avatar img').attr('src', avatar);
        }
    });
    fetch('username', (username) => {
        $('.account-details #username').text(username);
        $('.basic-username div').html(username);
    });
    fetch('email', (email) => {
        $('.account-details #email').text(email);
        gateway(); // Initializes websocket connection after the last fetch is done.
    });
    fetch('id', (id) => {
        $('.basic-username').attr('aria-label', id);
    })
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
                    url: 'php/insert',
                    type: 'POST',
                    headers: {
                        'Authorization': `User ${fetch_token()}`
                    },
                    data: {
                        kind: 'join',
                        id: id
                    },
                    dataType: 'json',
                    cache: false,
                    success: (response) => {
                        if ('code' in response) {
                            switch (response['message']) {
                                case 'unauthorized': {
                                    $('#join-error')
                                        .css({
                                            'width': '100%',
                                        })
                                        .text('This ID does not exist');
                                } break;

                                case 'forbidden': {
                                    $('#join-error')
                                        .css({
                                            'width': '100%',
                                        })
                                        .text('You already are in this server');
                                } break;
                            }
                        } else {
                            make_server(response['name'], id);
                            $('#join-error').text('');
                            close_add_server();
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
                url: 'php/logout',
                type: 'GET',
                data: {},
                cache: false,
                success: (_) => {
                    window.location.replace('index');
                }
            });
            storage().clear();
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
                    insert_avatar(event.target.files[0]);
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
});

function make_server(name, guild) {
    $('.basic-server-list')
        .append(
            `<div class="basic-server-instance" aria-label>` +
                `<div class="pill"></div>` +
            `</div>`)
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
                            .val(guild)
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
                                $('.basic-master-header').html('');
                                $('.basic-sidebar-scroller').html('');
                                $('.basic-master-container')
                                    .html(
                                        `<div class="basic-default-container">` +
                                            `<img draggable="false" src="assets/icons/logo.png" alt>` +
                                        `</div>`);
                            } else {
                                next.trigger('click');
                            }
                        }
                        leave_server(guild);
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
                    fetch_channels(guild, (response) => {
                        let channels = '';
                        for (const channel of response) {
                            channels +=
                                `<div class="basic-channel-instance" aria-label>` +
                                    `<img draggable="false" src="assets/icons/hash.png" alt>` +
                                    `<div class="basic-text" id="${channel['id']}">${channel['name']}</div>` +
                                `</div>`;
                        }
                        $('.basic-sidebar-channels')
                            .children()
                            .html(channels)
                            .children()
                            .on('click', function () {
                                const current = $(this);
                                if ($('div.basic-channel-instance[aria-label="selected"]')[0] !== current[0]) {
                                    const name    = current.children('.basic-text').text();
                                    const channel = current.children('.basic-text').attr('id');
                                    const loader  = $('.basic-loader');
                                    loader.show();
                                    $('.basic-master-header')
                                        .html(`<img draggable="false" src="assets/icons/hash.png" alt>` +
                                              `<div class="basic-text">${name}</div>`);
                                    dispatch_event({
                                        op: 0,
                                        type: 'transition_channel',
                                        payload: {
                                            channel: channel
                                        }
                                    });
                                    fetch_messages(channel, undefined, 'up', false);
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
                                        .html(
                                            `<div class="basic-message-scroller">` +
                                                `<div>` +
                                                    `<div class="basic-message-wrapper"></div>` +
                                                `</div>` +
                                            `</div>` +
                                                `<div class="basic-message-sender">` +
                                                    `<div class="basic-textbox-wrapper">` +
                                                    `<div class="basic-message-textbox" placeholder="Message #${name}" role="textbox" contenteditable></div>` +
                                                `</div>` +
                                            `</div>`);
                                    $('.basic-message-scroller')
                                        .on('scroll', function () {
                                            scroll_update(channel, $(this));
                                        });
                                    $('.basic-message-textbox')
                                        .on('keydown', function (event) {
                                            if (event.key === 'Enter' && !event.shiftKey) {
                                                event.preventDefault();
                                                const content = $(this).text().trim();
                                                if (content !== '') {
                                                    $(this).html('');
                                                    const data = {
                                                        op: 0,
                                                        type: 'message_create',
                                                        payload: {
                                                            id: `${$('.basic-username').attr('aria-label')}`,
                                                            author: `${$('.account-details #username').text()}`,
                                                            guild: `${guild}`,
                                                            channel: `${channel}`,
                                                            message: {
                                                                id: `${next_id()}`,
                                                                content: content
                                                            }
                                                        }
                                                    };
                                                    $.ajax({
                                                        url: 'php/insert',
                                                        type: 'POST',
                                                        headers: {
                                                            'Authorization': `User ${fetch_token()}`
                                                        },
                                                        data: {
                                                            kind: 'message',
                                                            message: JSON.stringify(data['payload'])
                                                        },
                                                        cache: false,
                                                        success: (_) => {}
                                                    });
                                                    dispatch_event(data);
                                                }
                                            }
                                        })
                                        .on('paste', function (event) {
                                            event.preventDefault();
                                            const clipboard = event.originalEvent.clipboardData;
                                            document.execCommand('inserttext',  false,  clipboard.getData('text/plain'));
                                        });
                                    loader.fadeOut(500);
                                }
                            })
                            .first()
                            .trigger('click');
                        $('.basic-sidebar-header .basic-text').text(name);
                    });
                }
            }
        });
}

const scroll_update = (function () {
    let old_scroll = 4000;
    return function (channel, element) {
        if ($('.basic-message-group').first().attr('aria-label') !== 'beginning') {
            const messages   = $('.basic-message-wrapper');
            const difference = messages.outerHeight() - element.height() + element.scrollTop();
            if (old_scroll >= difference) {
                old_scroll    = difference;
                const last    = $('.basic-chat-message').first().attr('id');
                const current = messages.html();
                element.off('scroll');
                fetch_messages(channel, last, 'down', true, () => {
                    messages.append(current);
                    element
                        .delay(1000)
                        .on('scroll', () => {
                            scroll_update(channel, element);
                        });
                });
            }
        }
    };
})();

function fetch_servers() {
    $.ajax({
        url: 'php/fetch',
        type: 'GET',
        headers: {
            'Authorization': `User ${fetch_token()}`
        },
        data: {
            kind: 'guild'
        },
        dataType: 'json',
        cache: true,
        success: (response) => {
            if ('code' in response) {
                switch (response['message']) {
                    case 'unauthorized': {
                        window.location.replace('login');
                    } break;
                }
            } else {
                for (const server of response) {
                    make_server(server['name'], server['id']);
                }
            }
        }
    });
}

function fetch_messages(channel, last, direction, remove, callback) {
    $.ajax({
        url: 'php/messages',
        type: 'GET',
        headers: {
            'Authorization': `User ${fetch_token()}`
        },
        data: {
            channel: channel,
            last: last,
            direction: direction
        },
        dataType: 'json',
        cache: true,
        success: (response) => {
            if ('code' in response) {
                switch (response['message']) {
                    case 'unauthorized': {
                        window.location.replace('login');
                    } break;
                }
            } else {
                if (remove) {
                    $('.basic-message-wrapper').html('');
                }
                for (const message of response) {
                    insert_message({
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
                if (response.length !== 50) {
                    $('.basic-message-group')
                        .first()
                        .attr({ 'aria-label': 'beginning' });
                }
                if (callback !== undefined) {
                    callback();
                }
            }
        }
    });
}

const fetch_channels = (function () {
    let cached = {};
    return function (id, callback) {
        if (!(id in cached)) {
            $.ajax({
                url: 'php/fetch',
                type: 'GET',
                headers: {
                    'Authorization': `User ${fetch_token()}`
                },
                data: {
                    kind: 'channels',
                    id: id
                },
                dataType: 'json',
                cache: true,
                success: (response) => {
                    if ('code' in response) {
                        switch (response) {
                            case 'unauthorized': {
                                window.location.replace('login');
                            } break;
                        }
                    } else {
                        callback(cached[id] = response);
                    }
                }
            });
        } else {
            callback(cached[id]);
        }
    };
})();

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
        url: 'php/insert',
        type: 'POST',
        headers: {
            'Authorization': `User ${fetch_token()}`
        },
        data: { // TODO: Handle Guild Avatars.
            kind: 'guild',
            name: name,
            id: id,
        },
        dataType: 'json',
        cache: false,
        success: (response) => {
            if ('code' in response) {
                switch (response['message']) {
                    case 'unauthorized': {
                        window.location.replace('login');
                    } break;
                }
            } else {
                close_add_server($('.add-server-container'));
                make_server(name, id);
            }
        }
    });
}

function leave_server(id) {
    $.ajax({
        url: 'php/delete',
        type: 'POST',
        headers: {
            'Authorization': `User ${fetch_token()}`
        },
        data: {
            kind: 'guild',
            id: id,
        },
        dataType: 'json',
        cache: false,
        success: (response) => {
            switch (response['message']) {
                case 'unauthorized': {
                    window.location.replace('login');
                } break;
            }
        }
    });
}

function insert_message(payload, avatar) {
    const author    = payload['author'];
    const unescaped = payload['message']['content'].replaceAll(/\\n\\r/g, '\n');
    const content   = $('<div>').text(unescaped).html();
    const grouped   = $('.basic-message-username').last().text() === author;
    const messages  = $('.basic-message-wrapper');

    if (!grouped) {
        const insert = (avatar) => {
            const path = avatar === null ? 'assets/icons/blank.png' : avatar;
            messages.append(
                `<div class="basic-message-group basic-group-start">` +
                    `<div class="basic-chat-message" id="${payload['message']['id']}">` +
                        `<div class="basic-message-avatar">` +
                            `<img src="${path}" alt>` +
                        `</div>` +
                        `<div class="basic-message-text">` +
                            `<div class="basic-message-username">${author}</div>` +
                            `<div class="basic-message-content">${content}</div>` +
                        `</div>` +
                    `</div>` +
                `</div>`);
        };
        if (avatar === undefined) {
            fetch_avatar(payload['id'], false, false, insert);
        } else {
            insert(avatar);
        }
    } else {
        messages.append(
            `<div class="basic-message-group">` +
                `<div class="basic-chat-message" id="${payload['message']['id']}">` +
                    `<div class="basic-message-content">${content}</div>` +
                `</div>` +
            `</div>`);
    }
}

function dispatch_event(data) {
    gateway().send(JSON.stringify(data));
    console.log('[Info] dispatch_event:', data);
    switch (data['type']) {
        case 'message_create': {
            insert_message(data['payload'], undefined);
        } break;
    }
}

function insert_avatar(file) {
    let data = new FormData();
    data.append('kind', 'avatar');
    data.append('avatar', file);
    $.ajax({
        url: 'php/insert',
        type: 'POST',
        headers: {
            'Authorization': `User ${fetch_token()}`
        },
        data: data,
        dataType: 'json',
        processData: false,
        contentType: false,
        cache: false,
        success: (response) => {
            if ('code' in response) {
                switch (response['message']) {
                    case 'unsupported_format': {
                        alert('There was an error uploading your image');
                    } break;
                }
            } else {
                fetch_avatar('0', true, true, (avatar) => {
                    $('.basic-user-icon img').attr('src', avatar);
                    $('.account-avatar img').attr('src', avatar);
                });
            }
        }
    });
}

const fetch = (function () {
    let cached = {};
    return function (kind, callback) {
        if (!(kind in cached)) {
            $.ajax({
                url: 'php/fetch',
                type: 'GET',
                headers: {
                    'Authorization': `User ${fetch_token()}`
                },
                data: {
                    kind: kind
                },
                dataType: 'json',
                cache: true,
                success: (response) => {
                    if ('code' in response) {
                        switch (response['message']) {
                            case 'unauthorized': {
                                window.location.replace('login');
                            } break;
                        }
                    } else {
                        callback(cached[kind] = response[kind]);
                    }
                }
            });
        } else {
            callback(cached[kind]);
        }
    };
})();

const gateway = (function () {
    let wss       = null;
    let tries     = 0;
    let heartbeat = null;
    const open =
        (_) => {
            const channel = $('div.basic-channel-instance[aria-label="selected"]');
            if (channel.length !== 0) {
                const id   = channel.children('.basic-text').attr('id');
                const last = $('.basic-chat-message').last().attr('id');
                dispatch_event({
                    op: 0,
                    type: 'transition_channel',
                    payload: {
                        channel: id
                    }
                });
                fetch_messages(id, last, 'down', false);
            }
            tries = 0;
            heartbeat = setInterval(function keep_alive() {
                dispatch_event({
                    op: 1,
                    type: 'heartbeat'
                });
            }, 60000);
            console.log('[Info]: connection successful');
            $('.basic-loader').fadeOut(500);
        };
    const message =
        (payload) => {
            const data = JSON.parse(payload.data);
            switch (data['type']) {
                case 'message_create': {
                    insert_message(data['payload'], undefined);
                } break;

                case 'heartbeat': {
                    // TODO: Something useful lol.
                } break;
            }
        };
    const close =
        () => {
            if (tries++ > 5) {
                wss = null;
                console.error('[Error]: cannot connect to the websocket server');
                $('.basic-loader').show();
                setTimeout(gateway, 30000);
            } else {
                clearInterval(heartbeat);
                console.log('[Info]: connection terminated');
                wss = new WebSocket('wss://gateway.alex8675.eu:2096');
                wss.onopen    = open;
                wss.onmessage = message;
                wss.onclose   = close;
            }
        };
    return function () {
        if (wss === null) {
            wss = new WebSocket('wss://gateway.alex8675.eu:2096');
            wss.onopen    = open;
            wss.onmessage = message;
            wss.onclose   = close;
        }
        return wss;
    }
})();

const fetch_avatar = (function () {
    let cached = {};
    return function (id, invalidate, async, callback) {
        if (cached[id] === undefined) {
            cached[id] = null;
        }
        if (invalidate || cached[id] === null) {
            $.ajax({
                url: 'php/fetch',
                type: 'GET',
                headers: {
                    'Authorization': `User ${fetch_token()}`
                },
                data: {
                    kind: 'avatar',
                    id: `${id}`,
                },
                async: async,
                dataType: 'json',
                cache: true,
                success: (response) => {
                    if ('code' in response) {
                        switch (response['message']) {
                            case 'unauthorized': {
                                window.location.replace('login');
                            } break;
                        }
                    } else {
                        callback(cached[id] = response['avatar']);
                    }
                }
            });
        } else {
            callback(cached[id]);
        }
    }
})();

function fetch_token() {
    return storage().getItem('token');
}