<?php
    include_once 'common.php';
    if (!session_start() && !isset($_SESSION['username'])) {
        die('unknown_session');
    }

    $connection = connect_database();
    $kind       = $_POST['kind'];
    switch ($kind) {
        case 'username': {
            echo $_SESSION['username'];
        } break;

        default: die('unknown_kind');
    }