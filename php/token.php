<?php
    include_once 'common.php';
    start_session();
    print json_encode(['token' => $_SESSION['token']]);