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
            .css('color', '#d71d48')
            .show();
    } else if (email.length === 0) {
        result
            .text('email field cannot be empty')
            .css('color', '#d71d48')
            .show();
    } else if (password.length === 0) {
        result
            .text('password field cannot be empty')
            .css('color', '#d71d48')
            .show();
    } else if (confirm.length === 0) {
        result
            .text('confirm password')
            .css('color', '#d71d48')
            .show();
    } else if (password !== confirm) {
        result
            .text('password mismatch')
            .css('color', '#d71d48')
            .show();
    } else if (!email.includes('@')) {
        result
            .text('invalid email address')
            .css('color', '#d71d48')
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
                if (response.length === 0) {
                    result.hide();
                    window.location.replace('login');
                } else {
                    switch (response) {
                        case 'duplicate_username': {
                            result
                                .text('the username already exists')
                                .css('color', '#d71d48')
                                .show();
                        } break;

                        case 'duplicate_email': {
                            result
                                .text('the email already exists')
                                .css('color', '#d71d48')
                                .show();
                        } break;

                        default: {
                            console.log(response);
                        } break;
                    }
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
            .css('color', '#d71d48')
            .show();
    } else if (password.length === 0) {
        result
            .text('email field cannot be empty')
            .css('color', '#d71d48')
            .show();
    } else {
        $.ajax({
            url: 'php/login.php',
            type: 'POST',
            data: {
                username: username,
                password: password,
            },
            cache: false,
            success: (response) => {
                if (response.length === 0) {
                    result.hide();
                    window.location.replace('app');
                } else {
                    switch (response) {
                        case 'not_found': {
                            result
                                .text('unknown username or password')
                                .css('color', '#d71d48')
                                .show();
                        } break;

                        default: {
                            console.log(response);
                        } break;
                    }
                }
            }
        });
    }
    return false;
}