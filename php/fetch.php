<?php
    if (!session_start() || count($_SESSION) == 0) {
        die('unknown_session');
    }

    $kind = $_POST['kind'];
    print match ($kind) {
        'username' => $_SESSION['username'],
        default     => die('unknown_kind')
    };