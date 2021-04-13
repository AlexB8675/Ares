$(function () {
    $('#result').hide();
    $('input')
        .on('focusin', function () {
            $(`label[for=${$(this).attr('id')}]`)
                .css('top', '-5px');
        })
        .on('focusout', function () {
            if ($(this).val() === "") {
                $(`label[for=${$(this).attr('id')}]`)
                    .css('top', '30px');
            }
        });
    $('#login-form')
        .on('submit', function (event) {
            event.preventDefault();
            return login();
        });
    $('#register-form')
        .on('submit', function (event) {
            event.preventDefault();
            return register();
        });
});

function register() {
    const username = $('#username').val();
    const email    = $('#email').val();
    const password = $('#password').val();
    const confirm  = $('#confirm').val();
    let   result   = $('#result');

    if (username.length === 0) {
        result
            .text('username field cannot be empty')
            .css('color', 'rgb(215, 29, 72)')
            .show();
    } else if (email.length === 0) {
        result
            .text('email field cannot be empty')
            .css('color', 'rgb(215, 29, 72)')
            .show();
    } else if (password.length === 0) {
        result
            .text('password field cannot be empty')
            .css('color', 'rgb(215, 29, 72)')
            .show();
    } else if (confirm.length === 0) {
        result
            .text('confirm password')
            .css('color', 'rgb(215, 29, 72)')
            .show();
    } else if (password !== confirm) {
        result
            .text('password mismatch')
            .css('color', 'rgb(215, 29, 72)')
            .show();
    } else if (!email.includes('@')) {
        result
            .text('invalid email address')
            .css('color', 'rgb(215, 29, 72)')
            .show();
    } else {
        $.ajax({
            url: 'php/register.php',
            type: 'POST',
            data: {
                id: next_id(),
                username: username,
                email: email,
                password: password,
            },
            cache: false,
            success: (response) => {
                if ('code' in response) {
                    switch (response['message']) {
                        case 'duplicate_username': {
                            result
                                .text('the username already exists')
                                .css('color', 'rgb(215, 29, 72)')
                                .show();
                        } break;

                        case 'duplicate_email': {
                            result
                                .text('the email already exists')
                                .css('color', 'rgb(215, 29, 72)')
                                .show();
                        } break;
                    }
                } else {
                    result.hide();
                    window.location.replace('login');
                }
            }
        });
    }
    return false;
}

function login() {
    const username = $('#username').val();
    const password = $('#password').val();
    let   result   = $('#result');
    if (username.length === 0) {
        result
            .text('username field cannot be empty')
            .css('color', 'rgb(215, 29, 72)')
            .show();
    } else if (password.length === 0) {
        result
            .text('email field cannot be empty')
            .css('color', 'rgb(215, 29, 72)')
            .show();
    } else {
        $.ajax({
            url: 'php/login.php',
            type: 'GET',
            data: {
                username: username,
                password: password,
            },
            dataType: 'json',
            cache: true,
            success: (response) => {
                if ('code' in response) {
                    switch (response['message']) {
                        case 'unauthorized': {
                            result
                                .text('unknown username or password')
                                .css('color', 'rgb(215, 29, 72)')
                                .show();
                        } break;
                    }
                } else {
                    result.hide();
                    storage().setItem('token', response['token']);
                    window.location.replace('app');
                }
            }
        });
    }
    return false;
}