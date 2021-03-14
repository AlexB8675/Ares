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
});

function register() {
    const username = $('#username').val();
    const email    = $('#email').val();
    const password = $('#password').val();
    const confirm  = $('#confirm').val();
    let   result   = $('#result');

    if (username.length === 0) {
        result
            .text('il campo nome utente non può essere vuoto')
            .css('color', '#d71d48')
            .show();
    } else if (email.length === 0) {
        result
            .text('il campo email non può essere vuoto')
            .css('color', '#d71d48')
            .show();
    } else if (password.length === 0) {
        result
            .text('il campo password non può essere vuoto')
            .css('color', '#d71d48')
            .show();
    } else if (confirm.length === 0) {
        result
            .text('il campo conferma password non può essere vuoto')
            .css('color', '#d71d48')
            .show();
    } else if (password !== confirm) {
        result
            .text('le password non corrispondono')
            .css('color', '#d71d48')
            .show();
    } else if (!email.includes('@')) {
        result
            .text('l\'indirizzo email non è valido')
            .css('color', '#d71d48')
            .show();
    } else {
        $.ajax({
            url: 'php/register.php',
            type: 'POST',
            data: {
                username: username,
                email: email,
                password: password,
            },
            cache: false,
            success: (response) => {
                console.log(response);
                switch (response) {
                    case 'duplicate_username': {
                        result
                            .text('il nome utente inserito già è stato registrato')
                            .css('color', '#d71d48')
                            .show();
                    } break;

                    case 'duplicate_email': {
                        result
                            .text('l\'email inserita già è stata registrata')
                            .css('color', '#d71d48')
                            .show();
                    } break;

                    default: {
                        result.hide();
                        window.location.replace('login.html');
                    } break;
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
            .text('il campo nome utente non può essere vuoto')
            .css('color', '#d71d48')
            .show();
    } else if (password.length === 0) {
        result
            .text('il campo password non può essere vuoto')
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
                console.log(response);
                switch (response) {
                    case 'not_found': {
                        result
                            .text('nome utente o password errati')
                            .css('color', '#d71d48')
                            .show();
                    } break;

                    default: {
                        result.hide();
                        window.location.replace('app.html');
                    } break;
                }
            }
        });
    }
    return false;
}